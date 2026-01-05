
import jsPDF from 'jspdf';

interface ReportData {
  name: string;
  location: string;
  status: string;
  aiReport: string | null;
  personnel: { total: number; details: Record<string, string> };
  mapImageBase64?: string | null; // Immagine della mappa in base64
  author?: { name: string; rank: string } | null;
  extraForms?: ExtraFormData[]; // Dati dai moduli HTML
}

// Tipo per i dati dei moduli extra
interface ExtraFormData {
  title: string;
  fields: { label: string; value: string }[];
}

// Funzione helper per caricare il logo come DataURL
const loadLogo = async () => {
  try {
    const response = await fetch('/logo-cfv.png');
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    return new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Impossibile caricare il logo PDF", e);
    return null;
  }
};

// Configurazione moduli HTML (pathname -> titolo)
const FORM_CONFIGS = [
  { path: '/progetto_fuoco.html', title: 'Progetto di Fuoco Prescritto' },
  { path: '/fase_preparazione.html', title: 'Fase di Preparazione' },
  { path: '/checklist_pre_esecuzione.html', title: 'Checklist Pre-Esecuzione' },
  { path: '/checklist_attrezzature.html', title: 'Checklist Attrezzature' },
  { path: '/piano_operativo.html', title: 'Piano Operativo e Sicurezza' },
  { path: '/piano_notifica.html', title: 'Piano di Notifica' },
  { path: '/checklist_vado_non_vado.html', title: 'Vado/Non Vado Checklist' },
];

// Funzione per raccogliere dati localStorage dei form HTML
export const collectFormDataFromLocalStorage = (): ExtraFormData[] => {
  const results: ExtraFormData[] = [];

  for (const config of FORM_CONFIGS) {
    const fields: { label: string; value: string }[] = [];
    let index = 0;
    let foundFields = false;

    // Cerca tutte le chiavi localStorage per questo form (max 200 campi)
    while (index < 200) {
      const key = `${config.path}_${index}`;
      const value = localStorage.getItem(key);

      if (value !== null && value !== '' && value !== 'false') {
        foundFields = true;
        const displayValue = value === 'true' ? '✓' : value;
        fields.push({ label: `Campo ${index + 1}`, value: displayValue });
      }
      index++;
    }

    if (foundFields && fields.length > 0) {
      results.push({ title: config.title, fields });
    }
  }

  return results;
};

export const generateOperationalReport = async (data: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // --- CARICAMENTO LOGO ---
  const logoDataUrl = await loadLogo();

  if (logoDataUrl) {
    // Logo in alto a sinistra (Stile Report Ufficiale)
    const logoSize = 25; // Dimensione del logo in mm
    doc.addImage(logoDataUrl, 'PNG', 15, 10, logoSize, logoSize);
  }

  // --- 1. INTESTAZIONE TESTUALE (Allineata accanto al logo) ---
  // Se c'è il logo, spostiamo il testo a destra, altrimenti al centro
  const textX = logoDataUrl ? 45 : pageWidth / 2;

  doc.setFontSize(16);
  doc.setTextColor(40, 67, 135); // Blu Forestale
  doc.text("CORPO FORESTALE SARDEGNA", textX, 20, { align: logoDataUrl ? "left" : "center" });

  yPosition = 28;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("REPORT OPERATIVO FUOCO PRESCRITTO", textX, yPosition, { align: logoDataUrl ? "left" : "center" });

  // Linea separatrice
  yPosition += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 15;

  // --- 2. DATI GENERALI ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DATI INTERVENTO:", 15, yPosition);
  yPosition += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`Nome Operazione: ${data.name}`, 15, yPosition);
  yPosition += 6;
  doc.text(`Data: ${new Date().toLocaleDateString('it-IT')} ${new Date().toLocaleTimeString('it-IT')}`, 15, yPosition);

  if (data.author) {
    yPosition += 6;
    doc.text(`Relatore: ${data.author.rank} ${data.author.name}`, 15, yPosition);
  }

  yPosition += 6;
  doc.text(`Posizione: ${data.location || 'N/A'}`, 15, yPosition);
  yPosition += 6;
  doc.text(`Stato: ${data.status || 'Completato'}`, 15, yPosition);

  // --- 3. INSERIMENTO MAPPA ---
  yPosition += 15;
  doc.setFont("helvetica", "bold");
  doc.text("MAPPA DELL'AREA:", 15, yPosition);
  yPosition += 10;

  // Se abbiamo un'immagine base64 della mappa, la inseriamo direttamente
  if (data.mapImageBase64) {
    try {
      const imgProps = doc.getImageProperties(data.mapImageBase64);
      const maxWidth = pageWidth - 40;
      const maxHeight = 80; // Altezza massima per la mappa in mm

      // Calcola le dimensioni mantenendo l'aspect ratio
      let imgWidth = maxWidth;
      let imgHeight = (imgProps.height * maxWidth) / imgProps.width;

      // Se l'altezza supera il massimo, ridimensioniamo
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = (imgProps.width * maxHeight) / imgProps.height;
      }

      // Centra l'immagine
      const imgX = (pageWidth - imgWidth) / 2;

      doc.addImage(data.mapImageBase64, 'PNG', imgX, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    } catch (error) {
      console.error("Errore inserimento mappa nel PDF:", error);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("(Mappa non disponibile - errore di rendering)", 20, yPosition);
      yPosition += 10;
    }
  } else {
    // Nessuna mappa disponibile
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("(Mappa non inclusa nel report)", 20, yPosition);
    yPosition += 10;
  }

  // --- 4. REPORT AI ANALISI ---
  yPosition += 15;

  // Controlla se dobbiamo andare a nuova pagina
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("ANALISI TECNICA (AI - CPS):", 20, yPosition);
  yPosition += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  // Clean markdown symbols roughly for PDF
  const cleanReport = (data.aiReport || "Nessun report disponibile.")
    .replace(/\*\*/g, '')
    .replace(/\*/g, '-')
    .replace(/#/g, '');

  const splitText = doc.splitTextToSize(cleanReport, pageWidth - 40);

  // Gestisci il testo che potrebbe andare oltre la pagina
  const lineHeight = 4;
  const maxY = doc.internal.pageSize.getHeight() - 30;

  for (const line of splitText) {
    if (yPosition > maxY) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(line, 20, yPosition);
    yPosition += lineHeight;
  }

  yPosition += 10;

  // --- 5. SICUREZZA E PERSONALE ---
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DATI SICUREZZA & PERSONALE:", 20, yPosition);
  yPosition += 7;
  doc.setFont("helvetica", "normal");

  if (data.personnel) {
    doc.text(`Totale Ore Uomo: ${data.personnel.total}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Operatori Coinvolti: ${Object.keys(data.personnel.details).length}`, 20, yPosition);
  }

  // --- 6. MODULI EXTRA (da localStorage) ---
  const extraForms = data.extraForms || collectFormDataFromLocalStorage();

  if (extraForms.length > 0) {
    for (const formData of extraForms) {
      // Nuova pagina per ogni modulo
      doc.addPage();
      yPosition = 20;

      // Titolo del modulo
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 67, 135);
      doc.text(formData.title.toUpperCase(), pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Linea separatrice
      doc.setDrawColor(200, 200, 200);
      doc.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 10;

      // Campi compilati
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      const maxFieldsPerPage = 35;
      let fieldCount = 0;

      for (const field of formData.fields) {
        if (fieldCount >= maxFieldsPerPage) {
          doc.addPage();
          yPosition = 20;
          doc.setFontSize(10);
          doc.text(`${formData.title} (continua)`, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 15;
          fieldCount = 0;
        }

        // Truncate long values
        const truncValue = field.value.length > 80 ? field.value.substring(0, 77) + '...' : field.value;
        doc.text(`• ${truncValue}`, 20, yPosition);
        yPosition += 5;
        fieldCount++;
      }
    }
  }

  // --- 7. FOOTER ---
  const bottomY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(0);
  doc.line(20, bottomY - 5, pageWidth - 20, bottomY - 5);
  doc.setFontSize(8);
  doc.text("Documento generato automaticamente da Corpo Forestale e di V.A. - Fuoco Prescritto 2.0", pageWidth / 2, bottomY, { align: "center" });
  doc.text("Prot. N° " + Math.floor(Math.random() * 100000), pageWidth - 40, bottomY);

  // --- 8. SALVATAGGIO STANDARD (Desktop/Mac Friendly) ---
  const safeName = (data.name || 'Report_Operativo').replace(/[^a-z0-9]/gi, '_');

  try {
    doc.save(`Report_Fuoco_${safeName}.pdf`);
  } catch (err) {
    console.error("Errore salvataggio:", err);
    alert("Errore nel salvataggio del file.");
  }
};
