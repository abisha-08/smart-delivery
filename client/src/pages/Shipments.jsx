import React from 'react';
import ShipmentTable from '../components/ShipmentTable';

export default function Shipments({
  shipments = [],
  onSelectShipment,
  selectedShipmentId = null
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <ShipmentTable
        shipments={shipments}
        onSelectShipment={onSelectShipment}
        selectedShipmentId={selectedShipmentId}
      />
    </div>
  );
}
