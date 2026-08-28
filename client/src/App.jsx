import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OfflineBanner from './components/OfflineBanner';
import ShipmentDrawer from './components/ShipmentDrawer';
import Toast from './components/Toast';

// Pages
import Dashboard from './pages/Dashboard';
import Shipments from './pages/Shipments';
import Network from './pages/Network';
import LiveEvents from './pages/LiveEvents';
import Settings from './pages/Settings';

// Services
import { api, isOffline } from './services/api';
import { offlineStorage } from './services/offlineStorage';

export default function App() {
  // Navigation State
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Application Data States
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState({
    activeShipments: 12,
    atRisk: 3,
    inTransit: 11,
    delayed: 2
  });
  const [network, setNetwork] = useState({ hubs: [], routes: [] });
  const [events, setEvents] = useState([]);
  const [countToday, setCountToday] = useState(0);

  // Active / Selected Shipment for Drawer
  const [selectedShipment, setSelectedShipment] = useState(null);
  // Persistent Dijkstra Recommended Route for Map Overlay
  const [recommendedRoute, setRecommendedRoute] = useState(null);

  // Status & Connectivity States
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(offlineStorage.isSimulatedOffline());
  const [pendingQueue, setPendingQueue] = useState(offlineStorage.getPendingQueue());
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [backendStatus, setBackendStatus] = useState('OK');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Update Pending Queue Count
  const updatePendingState = useCallback(() => {
    setPendingQueue(offlineStorage.getPendingQueue());
  }, []);

  // Load all platform data
  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      // 1. Health check
      const health = await api.getHealth();
      setBackendStatus(health.status === 'OK' ? 'OK' : 'UNAVAILABLE');

      // 2. Fetch Shipments
      const shipmentsRes = await api.getShipments();
      if (shipmentsRes?.data) {
        setShipments(shipmentsRes.data);
        // If drawer open, update selected shipment with fresh state
        if (selectedShipment) {
          const updated = shipmentsRes.data.find(
            s => s.id === selectedShipment.id || s.trackingNumber === selectedShipment.trackingNumber
          );
          if (updated) setSelectedShipment(updated);
        }
      }

      // 3. Fetch Stats
      const statsRes = await api.getStats();
      if (statsRes?.data) {
        setStats(statsRes.data);
      }

      // 4. Fetch Network
      const networkRes = await api.getNetwork();
      if (networkRes?.data) {
        setNetwork(networkRes.data);
      }

      // 5. Fetch Events
      const eventsRes = await api.getEvents({ limit: 60 });
      if (eventsRes?.data) {
        setEvents(eventsRes.data);
        setCountToday(eventsRes.countToday || eventsRes.data.length);
      }

      // 6. Simulation status
      if (!isOffline()) {
        const simRes = await api.getSimulationStatus();
        setIsSimulationRunning(Boolean(simRes?.active));
      }

      updatePendingState();
    } catch (err) {
      console.warn('[App] Data loading error:', err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, [selectedShipment, updatePendingState]);

  // Initial Load
  useEffect(() => {
    loadData();
  }, []);

  // Periodic Polling when online to consume live RFID simulation
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle Real Network Listeners
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      addToast({
        type: 'success',
        title: 'Connection Restored',
        message: 'Network link online. Auto-synchronizing pending operations...'
      });
      if (!offlineStorage.isSimulatedOffline()) {
        await handleSyncQueue();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast({
        type: 'warning',
        title: 'Connection Lost',
        message: 'Network link offline. Switching to local offline cache mode.'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  // Simulate Delay Action
  const handleSimulateDelay = async (shipmentId) => {
    try {
      const res = await api.simulateDelay(shipmentId, 20);
      if (res?.data) {
        setSelectedShipment(res.data);
        addToast({
          type: 'warning',
          title: 'Delay Detected',
          message: `Added +20m delay to ${res.data.trackingNumber} (Status: ${res.data.status.replace('_', ' ')})`
        });
        await loadData(true);
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Simulation Error',
        message: err.message || 'Unable to simulate delay'
      });
    }
  };

  // Recalculate Route using Dijkstra
  const handleRecalculateRoute = async (shipmentId) => {
    try {
      const res = await api.recalculateRoute(shipmentId);
      if (res) {
        const path = res.path || (res.data && res.data.recommendedRoute) || ['Denver', 'Dallas', 'Houston'];
        setRecommendedRoute(path);

        if (res.data) {
          setSelectedShipment({
            ...res.data,
            recommendedRoute: path
          });
        } else if (selectedShipment) {
          setSelectedShipment(prev => prev ? { ...prev, recommendedRoute: path } : null);
        }

        // Update active shipment in list immediately
        setShipments(prev => prev.map(s => {
          if (s.id === shipmentId || s.trackingNumber === shipmentId) {
            return { ...s, recommendedRoute: path };
          }
          return s;
        }));

        addToast({
          type: 'info',
          title: 'Route Recalculated',
          message: `Fastest Dijkstra path found: ${path.join(' → ')} (${res.travelTimeMinutes || 230} min)`
        });

        await loadData(true);
        return res;
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Calculation Error',
        message: err.message || 'Unable to recalculate route'
      });
    }
  };

  // Apply Recommended Route
  const handleApplyRoute = async (shipmentId) => {
    try {
      const res = await api.applyRoute(shipmentId);
      setRecommendedRoute(null);
      if (res?.data) {
        setSelectedShipment(res.data);
        addToast({
          type: 'success',
          title: 'Route Applied',
          message: `Alternative route applied for ${res.data.trackingNumber}. ETA updated.`
        });
        await loadData(true);
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Apply Error',
        message: err.message || 'Unable to apply route'
      });
    }
  };

  // Toggle Simulated Offline Mode
  const handleToggleSimulatedOffline = async () => {
    const nextState = !isSimulatedOffline;
    offlineStorage.setSimulatedOffline(nextState);
    setIsSimulatedOffline(nextState);

    if (nextState) {
      addToast({
        type: 'warning',
        title: 'Simulated Offline Mode Enabled',
        message: 'Platform disconnected from server. All actions will queue locally.'
      });
    } else {
      addToast({
        type: 'info',
        title: 'Simulated Online Mode Enabled',
        message: 'Reconnected to server. Synchronizing local operations...'
      });
      await handleSyncQueue();
    }
    updatePendingState();
  };

  // Synchronize Offline Queue
  const handleSyncQueue = async () => {
    setIsSyncing(true);
    try {
      const result = await api.syncQueue();
      if (result.syncedCount > 0) {
        addToast({
          type: 'success',
          title: 'Sync Complete',
          message: `✓ ${result.syncedCount} queued event(s) reconciled with SQLite database.`
        });
      } else {
        addToast({
          type: 'info',
          title: 'Sync Status',
          message: 'All local data is already up to date.'
        });
      }
      updatePendingState();
      await loadData(true);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Sync Failed',
        message: err.message || 'Could not complete synchronization with backend.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle Live Simulation
  const handleToggleSimulation = async () => {
    if (isOffline()) {
      addToast({
        type: 'warning',
        title: 'Offline Operation',
        message: 'Live background simulation generator operates when online.'
      });
      return;
    }

    try {
      if (isSimulationRunning) {
        await api.stopSimulation();
        setIsSimulationRunning(false);
        addToast({
          type: 'info',
          title: 'Simulation Paused',
          message: 'Live RFID event generation has paused.'
        });
      } else {
        await api.startSimulation();
        setIsSimulationRunning(true);
        addToast({
          type: 'success',
          title: 'Simulation Active',
          message: 'Simulated RFID scanner and IBM MQ feed is generating events.'
        });
      }
      await loadData(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Clear Local Cache
  const handleClearCache = async () => {
    offlineStorage.clearAllCache();
    updatePendingState();
    addToast({
      type: 'info',
      title: 'Local Cache Cleared',
      message: 'Browser storage reset. Reloading fresh server state...'
    });
    await loadData();
  };

  // Reset Demo Data
  const handleResetDemoData = async () => {
    try {
      await api.resetDemoData();
      updatePendingState();
      setSelectedShipment(null);
      setRecommendedRoute(null);
      addToast({
        type: 'success',
        title: 'Demo Data Reset',
        message: 'SQLite database restored to initial seed state (UPS1002 in Denver At-Risk).'
      });
      await loadData();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Reset Error',
        message: err.message || 'Failed to reset demo data'
      });
    }
  };

  // Page title mapping
  const getPageInfo = () => {
    switch (currentPage) {
      case 'dashboard':
        return {
          title: 'Dashboard',
          subtitle: 'Real-time logistics operations overview and risk monitoring'
        };
      case 'shipments':
        return {
          title: 'Shipment Monitoring',
          subtitle: 'Track every active package across the transportation network'
        };
      case 'network':
        return {
          title: 'Network Operations',
          subtitle: 'Multi-hub logistics corridor telemetry and route statuses'
        };
      case 'events':
        return {
          title: 'Legacy System Feed',
          subtitle: 'Simulated RFID scanner and message queue activity'
        };
      case 'settings':
        return {
          title: 'System & Diagnostics',
          subtitle: 'Operational runtime status and offline persistence controls'
        };
      default:
        return { title: 'UPS Platform', subtitle: 'Delay Intelligence' };
    }
  };

  const pageInfo = getPageInfo();
  const effectiveOffline = isSimulatedOffline || !isOnline;

  return (
    <div className="app-container">
      {/* Fixed Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        isOffline={effectiveOffline}
        pendingCount={pendingQueue.length}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header */}
        <Header
          pageTitle={pageInfo.title}
          pageSubtitle={pageInfo.subtitle}
          isSimulationRunning={isSimulationRunning}
          onToggleSimulation={handleToggleSimulation}
          isSimulatedOffline={isSimulatedOffline}
          onToggleSimulatedOffline={handleToggleSimulatedOffline}
          isOnline={isOnline}
          pendingCount={pendingQueue.length}
          onManualSync={handleSyncQueue}
          isSyncing={isSyncing}
        />

        {/* Persistent Offline Banner */}
        <OfflineBanner
          isOffline={effectiveOffline}
          pendingCount={pendingQueue.length}
          isSyncing={isSyncing}
          onSync={handleSyncQueue}
        />

        {/* Current View */}
        <main className="main-content">
          {currentPage === 'dashboard' && (
            <Dashboard
              stats={stats}
              shipments={shipments}
              network={network}
              events={events}
              selectedShipment={selectedShipment}
              recommendedRoute={recommendedRoute}
              onRecalculateRoute={handleRecalculateRoute}
              onSelectShipment={(s) => setSelectedShipment(s)}
              onViewAllEvents={() => setCurrentPage('events')}
              onRefresh={() => loadData()}
              isLoading={isLoading}
            />
          )}

          {currentPage === 'shipments' && (
            <Shipments
              shipments={shipments}
              onSelectShipment={(s) => setSelectedShipment(s)}
              selectedShipmentId={selectedShipment?.id}
            />
          )}

          {currentPage === 'network' && (
            <Network
              network={network}
              shipments={shipments}
              selectedShipment={selectedShipment}
              recommendedRoute={recommendedRoute}
              onRecalculateRoute={handleRecalculateRoute}
              onSelectShipment={(s) => setSelectedShipment(s)}
            />
          )}

          {currentPage === 'events' && (
            <LiveEvents
              events={events}
              countToday={countToday}
              isSimulationRunning={isSimulationRunning}
              onToggleSimulation={handleToggleSimulation}
              onRefresh={() => loadData()}
              isLoading={isLoading}
              onSelectShipmentByTracking={(trackingNum) => {
                const found = shipments.find(s => s.trackingNumber === trackingNum);
                if (found) setSelectedShipment(found);
              }}
            />
          )}

          {currentPage === 'settings' && (
            <Settings
              backendStatus={backendStatus}
              isOnline={isOnline}
              isSimulatedOffline={isSimulatedOffline}
              isSimulationRunning={isSimulationRunning}
              pendingQueue={pendingQueue}
              onClearCache={handleClearCache}
              onResetDemoData={handleResetDemoData}
              onManualSync={handleSyncQueue}
              isSyncing={isSyncing}
            />
          )}
        </main>
      </div>

      {/* Shipment Details Drawer */}
      <ShipmentDrawer
        shipment={selectedShipment}
        onClose={() => setSelectedShipment(null)}
        onSimulateDelay={handleSimulateDelay}
        onRecalculateRoute={handleRecalculateRoute}
        onApplyRoute={handleApplyRoute}
        events={events}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
