import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Search,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../lib/api';
import { formatLempiras, formatDateTime } from '../lib/utils';
import type { ReportData } from '../types';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function ReportesPage() {
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/report?startDate=${startDate}&endDate=${endDate}`);
      setReportData(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al generar reporte');
    } finally {
      setLoading(false);
    }
  };

  const loadTodayReport = async () => {
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/report?startDate=${today}&endDate=${today}`);
      setReportData(res.data);
    } catch {
      toast.error('Error al generar reporte');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();

    // Header
    doc.setFillColor(107, 58, 42);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('M&M Café y Más...', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Reporte de Ventas', 105, 23, { align: 'center' });
    doc.text(
      `${startDate} - ${endDate}`,
      105,
      30,
      { align: 'center' }
    );

    // Summary
    doc.setTextColor(107, 58, 42);
    doc.setFontSize(14);
    doc.text('Resumen', 14, 45);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Total de Órdenes: ${reportData.totalOrders}`, 14, 55);
    doc.text(`Total Vendido: ${formatLempiras(reportData.totalSales)}`, 14, 62);

    // Top Products Table
    if (reportData.topProducts.length > 0) {
      doc.setTextColor(107, 58, 42);
      doc.setFontSize(14);
      doc.text('Productos Más Vendidos', 14, 78);

      autoTable(doc, {
        startY: 83,
        head: [['Producto', 'Cantidad', 'Total']],
        body: reportData.topProducts.slice(0, 15).map((p) => [
          p.name,
          p.quantity.toString(),
          formatLempiras(p.total),
        ]),
        headStyles: { fillColor: [107, 58, 42] },
        alternateRowStyles: { fillColor: [250, 245, 238] },
        styles: { fontSize: 9 },
      });
    }

    // Orders detail
    if (reportData.orders.length > 0) {
      doc.addPage();
      doc.setFillColor(107, 58, 42);
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text('Detalle de Órdenes', 105, 13, { align: 'center' });

      autoTable(doc, {
        startY: 25,
        head: [['# Orden', 'Fecha', 'Items', 'Pago', 'Total']],
        body: reportData.orders.map((o) => [
          o.orderNumber,
          formatDateTime(o.createdAt),
          o.items.length.toString(),
          o.paymentMethod,
          formatLempiras(o.total),
        ]),
        headStyles: { fillColor: [107, 58, 42] },
        alternateRowStyles: { fillColor: [250, 245, 238] },
        styles: { fontSize: 8 },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `M&M Café y Más... - Generado el ${new Date().toLocaleString('es-HN')} - Página ${i} de ${pageCount}`,
        105,
        290,
        { align: 'center' }
      );
    }

    doc.save(`Reporte_MMCafe_${startDate}_${endDate}.pdf`);
    toast.success('PDF generado exitosamente');
  };

  const exportExcel = () => {
    if (!reportData) return;

    // Summary sheet
    const summaryData = [
      ['M&M Café y Más... - Reporte de Ventas'],
      ['Período:', `${startDate} - ${endDate}`],
      ['Total Órdenes:', reportData.totalOrders],
      ['Total Vendido:', reportData.totalSales],
      [],
      ['Productos Más Vendidos'],
      ['Producto', 'Cantidad', 'Total'],
      ...reportData.topProducts.map((p) => [p.name, p.quantity, p.total]),
    ];

    // Orders sheet
    const ordersData = [
      ['# Orden', 'Fecha', 'Cajero', 'Items', 'Método de Pago', 'Total', 'Estado'],
      ...reportData.orders.map((o) => [
        o.orderNumber,
        formatDateTime(o.createdAt),
        o.user?.name || '',
        o.items.length,
        o.paymentMethod,
        o.total,
        o.status,
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    const ordersWs = XLSX.utils.aoa_to_sheet(ordersData);

    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');
    XLSX.utils.book_append_sheet(wb, ordersWs, 'Órdenes');

    XLSX.writeFile(wb, `Reporte_MMCafe_${startDate}_${endDate}.xlsx`);
    toast.success('Excel generado exitosamente');
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-bold text-cafe-700 dark:text-white">
          Reportes
        </h1>
        <p className="text-cafe-400 text-xs sm:text-sm mt-1">
          Genera reportes de ventas por período
        </p>
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-5">
        <div className="flex flex-col md:flex-row items-end gap-3 sm:gap-4">
          <div className="flex-1 w-full">
            <label className="text-sm font-medium text-cafe-700 dark:text-white mb-2 block">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="text-sm font-medium text-cafe-700 dark:text-white mb-2 block">
              Fecha Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={loadTodayReport} className="btn-outline flex items-center justify-center gap-1 sm:gap-2 flex-1 md:flex-none text-xs sm:text-sm min-h-[44px] cursor-pointer select-none">
              <Calendar size={14} />
              Hoy
            </button>
            <button onClick={generateReport} disabled={loading} className="btn-primary flex items-center justify-center gap-1 sm:gap-2 flex-1 md:flex-none text-xs sm:text-sm min-h-[44px] cursor-pointer select-none">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search size={16} />
                  Generar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="card p-3 sm:p-5 text-center">
              <p className="text-xs sm:text-sm text-cafe-400">Total Vendido</p>
              <p className="text-xl sm:text-3xl font-bold text-cafe-700 dark:text-white mt-1">
                {formatLempiras(reportData.totalSales)}
              </p>
            </div>
            <div className="card p-3 sm:p-5 text-center">
              <p className="text-xs sm:text-sm text-cafe-400">Total Órdenes</p>
              <p className="text-xl sm:text-3xl font-bold text-cafe-700 dark:text-white mt-1">
                {reportData.totalOrders}
              </p>
            </div>
            <div className="card p-3 sm:p-5 text-center">
              <p className="text-xs sm:text-sm text-cafe-400">Producto Más Vendido</p>
              <p className="text-sm sm:text-lg font-bold text-gold-400 mt-1">
                {reportData.topProducts[0]?.name || 'Sin datos'}
              </p>
              {reportData.topProducts[0] && (
                <p className="text-xs text-cafe-400">
                  {reportData.topProducts[0].quantity} unidades
                </p>
              )}
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button onClick={exportPDF} className="btn-danger flex items-center gap-1 sm:gap-2 text-xs sm:text-sm min-h-[44px] cursor-pointer select-none">
              <Download size={14} />
              PDF
            </button>
            <button onClick={exportExcel} className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold hover:bg-green-700 shadow-md hover:shadow-lg transition-all flex items-center gap-1 sm:gap-2 text-xs sm:text-sm min-h-[44px] cursor-pointer select-none">
              <FileSpreadsheet size={14} />
              Excel
            </button>
          </div>

          {/* Top Products */}
          {reportData.topProducts.length > 0 && (
            <div className="card p-3 sm:p-5">
              <h3 className="font-semibold text-cafe-700 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <TrendingUp size={18} />
                Productos Más Vendidos
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full table-zebra hidden sm:table">
                  <thead>
                    <tr className="bg-cream-200 dark:bg-gray-700">
                      <th className="text-left p-3 text-xs font-semibold text-cafe-600">#</th>
                      <th className="text-left p-3 text-xs font-semibold text-cafe-600">Producto</th>
                      <th className="text-center p-3 text-xs font-semibold text-cafe-600">Cantidad</th>
                      <th className="text-right p-3 text-xs font-semibold text-cafe-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topProducts.map((p, i) => (
                      <tr key={i} className="border-b border-cream-100">
                        <td className="p-3 text-sm text-cafe-500">{i + 1}</td>
                        <td className="p-3 text-sm font-medium text-cafe-700 dark:text-white">
                          {p.name}
                        </td>
                        <td className="p-3 text-sm text-center text-cafe-600">{p.quantity}</td>
                        <td className="p-3 text-sm text-right font-bold text-gold-400 whitespace-nowrap">
                          {formatLempiras(p.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards - Top Products */}
              <div className="sm:hidden space-y-2">
                {reportData.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between bg-cream-50 dark:bg-gray-800 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-cafe-400 w-5">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-cafe-700 dark:text-white">{p.name}</p>
                        <p className="text-xs text-cafe-400">{p.quantity} unidades</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gold-400 whitespace-nowrap">{formatLempiras(p.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders List */}
          {reportData.orders.length > 0 && (
            <div className="card p-3 sm:p-5">
              <h3 className="font-semibold text-cafe-700 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <FileText size={18} />
                Detalle de Órdenes ({reportData.orders.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full table-zebra hidden sm:table">
                  <thead>
                    <tr className="bg-cream-200 dark:bg-gray-700">
                      <th className="text-left p-3 text-xs font-semibold text-cafe-600"># Orden</th>
                      <th className="text-left p-3 text-xs font-semibold text-cafe-600">Fecha</th>
                      <th className="text-left p-3 text-xs font-semibold text-cafe-600 hidden md:table-cell">Cajero</th>
                      <th className="text-center p-3 text-xs font-semibold text-cafe-600">Pago</th>
                      <th className="text-right p-3 text-xs font-semibold text-cafe-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.orders.map((order) => (
                      <tr key={order.id} className="border-b border-cream-100">
                        <td className="p-3 text-sm font-medium text-cafe-700 dark:text-white">
                          {order.orderNumber}
                        </td>
                        <td className="p-3 text-xs text-cafe-500">
                          {formatDateTime(order.createdAt)}
                        </td>
                        <td className="p-3 text-sm text-cafe-600 hidden md:table-cell">
                          {order.user?.name}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.paymentMethod === 'EFECTIVO'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-right font-bold text-gold-400 whitespace-nowrap">
                          {formatLempiras(order.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards - Orders */}
              <div className="sm:hidden space-y-2">
                {reportData.orders.map((order) => (
                  <div key={order.id} className="bg-cream-50 dark:bg-gray-800 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-cafe-700 dark:text-white">{order.orderNumber}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        order.paymentMethod === 'EFECTIVO'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.paymentMethod}
                      </span>
                    </div>
                    <div className="text-xs text-cafe-400">{formatDateTime(order.createdAt)}</div>
                    {order.user?.name && (
                      <div className="text-xs text-cafe-500">{order.user.name}</div>
                    )}
                    <div className="text-right">
                      <span className="text-sm font-bold text-gold-400 whitespace-nowrap">{formatLempiras(order.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
