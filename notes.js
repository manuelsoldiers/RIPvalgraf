/* =========================================================================
   RIPValGraf — Database delle "Note PA".
   Fonte canonica dei testi: note-pa-database.md (tenere allineati).
   Due macro-categorie: "fisioterapica" e "infermieristica".
   Verranno usate anche per differenziare l'animazione di eliminazione riga.
   ========================================================================= */

const NOTES_DB = {
  // ---- 1) Prestazioni Fisioterapiche (50) ----
  fisioterapica: [
    "Ciclo di FKT per postumi di frattura del femore.",
    "Fisioterapia per esiti di intervento di artroprotesi d'anca.",
    "Fisiokinesiterapia per esiti di frattura della branca ileo-ischio-pubica.",
    "Riabilitazione motoria in paziente con esiti di ictus cerebri ed emiparesi destra.",
    "Ciclo riabilitativo per esiti di intervento di protesi di ginocchio.",
    "Rieducazione funzionale per esiti di frattura di omero.",
    "Trattamento riabilitativo per coxartrosi severa.",
    "Ciclo di fisioterapia per gonartrosi bilaterale.",
    "Rieducazione al cammino in paziente con recente dimissione da ricovero ortopedico.",
    "Fisioterapia respiratoria in paziente affetto da BPCO riacutizzata.",
    "Ciclo di FKT per lombosciatalgia cronica.",
    "Riabilitazione neuromotoria in paziente affetto da morbo di Parkinson.",
    "Fisiokinesiterapia per esiti di crollo vertebrale L1.",
    "Trattamento riabilitativo per lesione della cuffia dei rotatori.",
    "Ciclo di fisioterapia per capsulite adesiva di spalla.",
    "Rieducazione funzionale per esiti di intervento di ernia discale lombare.",
    "Riabilitazione motoria in paziente affetto da sclerosi multipla.",
    "Ciclo di FKT per sindrome da allettamento prolungato.",
    "Fisioterapia per postumi di frattura di polso.",
    "Mobilizzazione articolare per rigidità di ginocchio post-immobilizzazione.",
    "Riabilitazione in paziente con esiti di amputazione di arto inferiore.",
    "Ciclo riabilitativo per poliartrosi con importante ipomobilità.",
    "Fisiokinesiterapia per esiti di frattura di caviglia.",
    "Rieducazione motoria in paziente emiplegico da pregresso ictus.",
    "Ciclo di FKT per distorsione di ginocchio con lesione legamentosa.",
    "Fisioterapia per neuropatia periferica degli arti inferiori.",
    "Trattamento riabilitativo per esiti di politrauma della strada.",
    "Riabilitazione respiratoria in paziente con esiti di polmonite.",
    "Ciclo di fisioterapia per cervicobrachialgia.",
    "Rieducazione funzionale in paziente con protesi di spalla.",
    "Fisiokinesiterapia per esiti di frattura del piatto tibiale.",
    "Riabilitazione motoria per paraparesi in paziente allettato.",
    "Ciclo di FKT per esiti di frattura vertebrale dorsale.",
    "Fisioterapia per rizoartrosi con limitazione funzionale della mano.",
    "Trattamento riabilitativo per esiti di frattura di rotula.",
    "Rieducazione al cammino in paziente con instabilità posturale e cadute ricorrenti.",
    "Ciclo di fisioterapia per tendinopatia achillea.",
    "Riabilitazione neuromotoria per esiti di emorragia cerebrale.",
    "Fisiokinesiterapia per esiti di protesi d'anca da frattura di femore.",
    "Ciclo di FKT per scoliosi degenerativa con lombalgia.",
    "Fisioterapia per esiti di frattura scomposta di omero prossimale.",
    "Rieducazione funzionale per contrattura in flessione del ginocchio.",
    "Riabilitazione motoria in paziente affetto da distrofia muscolare.",
    "Ciclo riabilitativo per esiti di intervento di laminectomia.",
    "Fisiokinesiterapia per periartrite scapolo-omerale.",
    "Ciclo di FKT per esiti di frattura del malleolo peroneale.",
    "Fisioterapia per rigidità articolare in paziente con artrite reumatoide.",
    "Rieducazione motoria per deficit di forza agli arti inferiori.",
    "Trattamento riabilitativo per esiti di frattura del bacino.",
    "Riabilitazione per recupero del cammino dopo prolungata degenza.",
  ],

  // ---- 2) Prestazioni Infermieristiche (50) ----
  infermieristica: [
    "Medicazione di ferita chirurgica addominale post-intervento.",
    "Medicazione di lesione da pressione (LDP) sacrale di III grado.",
    "Medicazione di lesione da decubito (LDD) al tallone.",
    "Cambio catetere vescicale a permanenza.",
    "Prelievo ematico domiciliare per esami di routine.",
    "Terapia sottocutanea con eparina a basso peso molecolare.",
    "Medicazione di deiscenza di ferita chirurgica.",
    "Medicazione di ulcera vascolare venosa dell'arto inferiore.",
    "Sostituzione di catetere vescicale in paziente portatore a permanenza.",
    "Prelievo ematico per controllo INR in paziente in terapia anticoagulante.",
    "Medicazione di LDP trocanterica di II grado.",
    "Terapia intramuscolare a domicilio come da prescrizione.",
    "Medicazione di ferita chirurgica in esiti di amputazione di dita del piede.",
    "Gestione e medicazione di stomia.",
    "Medicazione di ulcera diabetica del piede.",
    "Cambio catetere vescicale con lavaggi in paziente con ematuria.",
    "Prelievo ematico domiciliare in paziente allettato.",
    "Terapia insulinica sottocutanea in paziente diabetico non autosufficiente.",
    "Medicazione di LDD sacrale di IV grado con cavità.",
    "Rimozione di punti di sutura di ferita chirurgica.",
    "Medicazione avanzata di lesione da pressione al tallone.",
    "Gestione di catetere venoso centrale (PICC) con medicazione.",
    "Medicazione di ferita chirurgica post-intervento ortopedico.",
    "Prelievo ematico per esami ematochimici di controllo.",
    "Terapia sottocutanea antalgica a domicilio.",
    "Medicazione di lesione da decubito multipla in paziente allettato.",
    "Cambio di catetere vescicale ostruito.",
    "Medicazione di ulcera arteriosa dell'arto inferiore.",
    "Somministrazione di terapia iniettiva intramuscolare.",
    "Medicazione di ferita chirurgica con segni di infezione.",
    "Prelievo ematico domiciliare in paziente con difficoltà agli spostamenti.",
    "Medicazione di LDP sacrale con terapia a pressione negativa (VAC).",
    "Gestione di nutrizione enterale via PEG.",
    "Medicazione di ustione di secondo grado.",
    "Terapia sottocutanea con eparina in paziente allettato.",
    "Cambio catetere vescicale a permanenza in paziente con vescica neurologica.",
    "Medicazione di lesione da decubito al gomito.",
    "Medicazione di ferita chirurgica addominale con deiscenza parziale.",
    "Prelievo ematico per monitoraggio della terapia in corso.",
    "Terapia intramuscolare antibiotica come da prescrizione medica.",
    "Medicazione di ulcera vascolare mista dell'arto inferiore.",
    "Rimozione di punti metallici di ferita chirurgica.",
    "Medicazione di LDP ischiatica di III grado.",
    "Cambio medicazione di catetere venoso centrale.",
    "Prelievo ematico domiciliare con emocromo e funzionalità renale.",
    "Terapia sottocutanea per idratazione (ipodermoclisi).",
    "Medicazione di piede diabetico infetto.",
    "Medicazione di lesione da pressione occipitale.",
    "Gestione della terapia infusionale a domicilio.",
    "Medicazione di ferita chirurgica in paziente diabetico.",
  ],
};

// Sceglie una nota casuale restituendo testo + macro-categoria.
// pFisio = probabilità (0..1) che la nota sia "fisioterapica"; il resto è
// "infermieristica". Se non specificata vale 0.5 (50/50).
// Il valore di pFisio viene estratto una volta per partita (vedi script.js)
// così ogni sessione ha un mix diverso tra le due macro-categorie.
function pickNota(pFisio = 0.5) {
  const categoria = Math.random() < pFisio ? "fisioterapica" : "infermieristica";
  const lista = NOTES_DB[categoria];
  const testo = lista[Math.floor(Math.random() * lista.length)];
  return { categoria, testo };
}
