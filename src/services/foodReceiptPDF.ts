import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReceiptData {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerPhone: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  totalAmount: number;
  currency: string;
  deliveryAddress: string;
  paymentMethod: string;
  status: string;
}

export const generateFoodReceipt = async (receiptData: ReceiptData): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // ==================== HEADER ====================
  doc.setFillColor(255, 165, 0); // Orange Kwenda
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('KWENDA FOOD', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Votre commande, livrée avec soin', pageWidth / 2, 28, { align: 'center' });

  yPosition = 50;

  // ==================== SECTION REÇU ====================
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('REÇU DE COMMANDE', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;

  // ==================== INFOS COMMANDE ====================
  doc.setFillColor(245, 245, 245);
  doc.rect(15, yPosition - 5, pageWidth - 30, 35, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);

  const leftCol = 20;
  const rightCol = pageWidth / 2 + 10;

  // Colonne gauche
  doc.text('N° COMMANDE:', leftCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(receiptData.orderNumber, leftCol, yPosition + 5);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('DATE:', leftCol, yPosition + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(format(new Date(receiptData.orderDate), 'dd MMMM yyyy à HH:mm', { locale: fr }), leftCol, yPosition + 17);

  // Colonne droite
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('STATUT:', rightCol, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(34, 197, 94); // Vert pour statut
  doc.text(getStatusLabel(receiptData.status), rightCol, yPosition + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('PAIEMENT:', rightCol, yPosition + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(getPaymentMethodLabel(receiptData.paymentMethod), rightCol, yPosition + 17);

  yPosition += 45;

  // ==================== RESTAURANT ====================
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('🍽️ RESTAURANT', 20, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(receiptData.restaurantName, 20, yPosition);
  yPosition += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(receiptData.restaurantAddress || 'Adresse non disponible', 20, yPosition);
  yPosition += 4;
  doc.text(`📞 ${receiptData.restaurantPhone}`, 20, yPosition);

  yPosition += 12;

  // ==================== CLIENT ====================
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('👤 CLIENT', 20, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(receiptData.customerName, 20, yPosition);
  yPosition += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`📞 ${receiptData.customerPhone}`, 20, yPosition);
  yPosition += 4;
  doc.text(`📍 ${receiptData.deliveryAddress}`, 20, yPosition);

  yPosition += 15;

  // ==================== TABLEAU DES ITEMS ====================
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAILS DE LA COMMANDE', 20, yPosition);
  yPosition += 5;

  const tableData = receiptData.items.map(item => [
    item.name,
    item.quantity.toString(),
    `${item.unitPrice.toLocaleString()} ${receiptData.currency}`,
    `${item.total.toLocaleString()} ${receiptData.currency}`
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Article', 'Qté', 'Prix Unit.', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [255, 165, 0], // Orange Kwenda
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [0, 0, 0]
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 80 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 }
    },
    margin: { left: 20, right: 20 },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    }
  });

  // @ts-ignore - autoTable modifie le doc
  yPosition = doc.lastAutoTable.finalY + 10;

  // ==================== TOTAUX ====================
  const totalsX = pageWidth - 70;
  const totalsLabelX = pageWidth - 110;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  doc.text('Sous-total:', totalsLabelX, yPosition, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  doc.text(`${receiptData.subtotal.toLocaleString()} ${receiptData.currency}`, totalsX, yPosition, { align: 'right' });
  yPosition += 6;

  doc.setTextColor(100, 100, 100);
  doc.text('Frais de livraison:', totalsLabelX, yPosition, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  doc.text(`${receiptData.deliveryFee.toLocaleString()} ${receiptData.currency}`, totalsX, yPosition, { align: 'right' });
  yPosition += 6;

  doc.setTextColor(100, 100, 100);
  doc.text('Frais de service:', totalsLabelX, yPosition, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  doc.text(`${receiptData.serviceFee.toLocaleString()} ${receiptData.currency}`, totalsX, yPosition, { align: 'right' });
  yPosition += 2;

  // Ligne de séparation
  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth - 110, yPosition, pageWidth - 20, yPosition);
  yPosition += 8;

  // Total final
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 165, 0); // Orange
  doc.text('TOTAL:', totalsLabelX, yPosition, { align: 'right' });
  doc.text(`${receiptData.totalAmount.toLocaleString()} ${receiptData.currency}`, totalsX, yPosition, { align: 'right' });

  yPosition += 20;

  // ==================== FOOTER ====================
  doc.setFillColor(245, 245, 245);
  doc.rect(20, pageHeight - 40, pageWidth - 40, 25, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Merci d\'avoir commandé avec Kwenda Food !', pageWidth / 2, pageHeight - 32, { align: 'center' });
  doc.text('Pour toute question, contactez notre support : support@kwenda.app', pageWidth / 2, pageHeight - 27, { align: 'center' });
  doc.text('www.kwenda.app | +243 XXX XXX XXX', pageWidth / 2, pageHeight - 22, { align: 'center' });

  // Ligne orange en bas de page
  doc.setFillColor(255, 165, 0);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');

  // ==================== SAUVEGARDE ====================
  const fileName = `kwenda-food-receipt-${receiptData.orderNumber}.pdf`;
  doc.save(fileName);
};

// Helpers
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    preparing: 'En préparation',
    ready: 'Prête',
    picked_up: 'En livraison',
    delivered: 'Livrée ✓',
    cancelled: 'Annulée'
  };
  return labels[status] || status;
};

const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    kwenda_pay: 'KwendaPay',
    cash: 'Espèces à la livraison',
    card: 'Carte bancaire',
    mobile_money: 'Mobile Money'
  };
  return labels[method] || method;
};
