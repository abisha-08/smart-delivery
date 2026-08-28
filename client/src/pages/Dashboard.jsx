import React from 'react';
import KPICard from '../components/KPICard';
import NetworkMap from '../components/NetworkMap';
import RiskPanel from '../components/RiskPanel';
import EventFeed from '../components/EventFeed';
import { Box, AlertTriangle, AlertOctagon, Truck, RefreshCw } from 'lucide-react';

export default function Dashboard({
  stats,
  shipments = [],
  network = { hubs: [], routes: [] },
  events = [],
  selectedShipment = null,
  recommendedRoute = null,
  onRecalculateRoute = null,
  onSimulateDisruption = null,
  onSelectShipment,
  onViewAllEvents,
  onRefresh,
  isLoading = false
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 4 Prominent Dynamic KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        <KPICard
          label="ACTIVE SHIPMENTS"
          value={stats.activeShipments}
          icon={Box}
          indicator="Total monitored packages"
          variant="gold"
        />

        <KPICard
          label="AT RISK"
          value={stats.atRisk}
          icon={AlertTriangle}
          indicator="Threatening delivery SLAs"
          variant="at-risk"
        />

        <KPICard
          label="IN TRANSIT"
          value={stats.inTransit}
          icon={Truck}
          indicator="Moving across 5 hubs"
          variant="transit"
        />

        <KPICard
          label="DELAYED"
          value={stats.delayed}
          icon={AlertOctagon}
          indicator="Exceeding threshold (>30m)"
          variant="delayed"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '20px',
        minHeight: '440px'
      }}>
        {/* Left / Large: Logistics Network Overview */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FBFBFA'
          }}>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#351C15' }}>
                Transportation Network Overview
              </h2>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>
                Live Corridor Telemetry • 5 Operational Hubs
              </div>
            </div>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="btn btn-sm btn-outline"
              title="Refresh telemetry"
            >
              <RefreshCw size={12} className={isLoading ? 'pulse-active' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          <div style={{ flex: 1, padding: '12px' }}>
            <NetworkMap
              hubs={network.hubs}
              routes={network.routes}
              activeShipments={shipments}
              selectedShipment={selectedShipment}
              recommendedPath={recommendedRoute || selectedShipment?.recommendedRoute}
              onRecalculateRoute={onRecalculateRoute}
            />
          </div>
        </div>

        {/* Right: At-Risk Shipments Panel */}
        <div>
          <RiskPanel
            shipments={shipments}
            onSelectShipment={onSelectShipment}
            onSimulateDisruption={onSimulateDisruption}
          />
        </div>
      </div>

      {/* Bottom: Live Legacy System Feed */}
      <div>
        <EventFeed
          events={events}
          maxItems={6}
          showViewAllButton={true}
          onViewAll={onViewAllEvents}
          onSelectShipmentByTracking={(trackingNum) => {
            const found = shipments.find(s => s.trackingNumber === trackingNum);
            if (found) onSelectShipment(found);
          }}
        />
      </div>

    </div>
  );
}
