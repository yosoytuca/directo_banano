import React from 'react';
import { Finca } from '../../types';
import { FincaCard } from './FincaCard';

interface FincaListProps {
  fincas: Finca[];
  token: string;
  currentWeek: number;
  onSelectFinca: (f: Finca) => void;
  onEditFinca: (f: Finca) => void;
  onHistorial: (f: Finca) => void;
  onDeleteFinca: (id: number) => void;
  onAddFinca: () => void;
  apiUrl: string;
}

export const FincaList: React.FC<FincaListProps> = ({ 
  fincas, 
  token, 
  currentWeek, 
  onSelectFinca, 
  onEditFinca, 
  onHistorial,
  onDeleteFinca,
  onAddFinca,
  apiUrl 
}) => {
  if (fincas.length === 0) {
    return (
      <div className="col-12 text-center py-5">
        <div className="alert alert-warning">
          <i className="fa-solid fa-triangle-exclamation"></i> 
          <strong>¡Atención!</strong> Debes registrar al menos una finca para comenzar.
        </div>
        <button className="btn btn-success" onClick={onAddFinca}>
          <i className="fa-solid fa-plus"></i> Registrar mi primera finca
        </button>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {fincas.map(f => (
        <FincaCard 
          key={f.id} 
          finca={f} 
          token={token} 
          currentWeek={currentWeek} 
          onSelect={onSelectFinca}
          onEdit={onEditFinca}
          onHistorial={onHistorial}
          onDelete={onDeleteFinca}
          apiUrl={apiUrl}
        />
      ))}
    </div>
  );
};
