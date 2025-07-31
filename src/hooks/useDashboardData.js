import { useState, useEffect } from "react";

// Simulación: reemplaza esto por tu fetch real
export function useDashboardData(segmentacion, tiposClientes) {
  const [loading, setLoading] = useState(true);
  const [kpisConvencional, setKpisConvencional] = useState([]);
  const [kpisRetadora, setKpisRetadora] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/bigquery/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        segmentacion,
        tiposClientes,
        table: 'Fidelizacion_Julio_M0' // Cambia por el nombre de tabla dinámico si es necesario
      }),
    })
      .then(res => res.json())
      .then(data => {
        console.log('Dashboard API response:', data);
        setKpisConvencional(data.kpisConvencional || []);
        setKpisRetadora(data.kpisRetadora || []);
        setChartData(data.chartData || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [segmentacion, JSON.stringify(tiposClientes)]);

  return { loading, kpisConvencional, kpisRetadora, chartData };
}
