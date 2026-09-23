/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

export type SupportedLanguage = 'it' | 'en' | 'es' | 'fr' | 'de';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
];

const STORAGE_KEY = 'stonks_language_preference_v1';
const LANGUAGE_CHANGE_EVENT = 'stonks_language_changed';

export function getStoredLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
    if (saved && ['it', 'en', 'es', 'fr', 'de'].includes(saved)) {
      return saved;
    }
    // Check browser language
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language?.slice(0, 2).toLowerCase();
      if (browserLang === 'it') return 'it';
      if (browserLang === 'es') return 'es';
      if (browserLang === 'fr') return 'fr';
      if (browserLang === 'de') return 'de';
      if (browserLang === 'en') return 'en';
    }
  } catch {}
  return 'it'; // Default to Italian
}

export function saveStoredLanguage(lang: SupportedLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: lang }));
    }
  } catch {}
}

export const translations = {
  it: {
    // Navigation & Tabs
    tab_activity: 'Attività',
    tab_reports: 'Report',
    tab_add: 'Aggiungi',
    menu: 'Menu',
    close: 'Chiudi',
    cancel: 'Annulla',
    save: 'Salva',
    delete: 'Elimina',
    confirm_delete: 'Conferma eliminazione',
    edit: 'Modifica',
    back: 'Indietro',

    // Speed dial / Quick actions
    record_expense: 'Spesa',
    record_income: 'Entrata',

    // Financial Telematics & Budget
    status_system_ready: 'SISTEMA PRONTO',
    status_budget_exceeded: 'BUDGET SUPERATO',
    status_budget_near_limit: 'QUASI AL LIMITE',
    status_optimal: 'TUTTO OK',
    status_on_track: 'SULLA BUONA STRADA',
    status_warning: 'USCITE ELEVATE',
    status_deficit: 'DISAVANZO ATTIVO',

    badge_initialized: 'INIZIALIZZATO',
    badge_limit_surpassed: 'LIMITE SUPERATO',
    badge_near_limit: 'ATTENZIONE BUDGET',
    badge_optimal: 'DENTRO IL BUDGET',
    badge_balanced: 'IN EQUILIBRIO',
    badge_high_outflow: 'FLUSSO ELEVATO',
    badge_deficit: 'DISAVANZO',

    net_balance: 'Saldo Netto',
    savings_margin: 'Margine di Risparmio',
    deficit_margin: 'Disavanzo',
    transaction_singular: 'transazione',
    transaction_plural: 'transazioni',

    monthly_budget_limit: 'Limite Budget Mensile',
    set_limit: 'Imposta Limite',
    change_limit: 'Modifica',
    budget_used: 'UTILIZZATO',
    remaining: 'rimanenti',
    over_limit: 'oltre il limite',
    per_day_left: 'giorno rimasti',

    income: 'Entrate',
    expenses: 'Uscite',
    deposits: 'accrediti',
    avg_per_day: 'Media',

    // Dynamic Adaptive Budget Commentary
    comment_no_transactions: 'Budget mensile impostato a {budget}. Nessuna transazione registrata questo mese: disponibilità stimata di {dailyBudget}/giorno per {daysInMonth} giorni.',
    comment_budget_exceeded: 'Hai superato il tuo budget di {budget} di ben {overBudget}! Uscite totali pari a {spent}. Riduci le spese discrezionali per i prossimi {daysRemaining} giorni.',
    comment_budget_near_limit: 'Attenzione: hai raggiunto il {percent}% del tuo budget di {budget} ({spent} già spesi). Ti restano solo {remaining} ({dailyRemaining}/giorno per {daysRemaining} giorni).',
    comment_optimal: 'Sei perfettamente dentro al budget di {budget}: spesi finora {spent} ({percent}%). Hai ancora un ampio margine di {remaining} a disposizione ({dailyRemaining}/giorno per i restanti {daysRemaining} giorni).',
    comment_balanced: 'Spese al {percent}% del budget ({spent} su {budget}). Sei in ritmo con {remaining} disponibili ({dailyRemaining}/giorno per i restanti {daysRemaining} giorni).',
    comment_warning: 'Uscite mensili a quota {spent} su un budget di {budget} ({percent}% impiegato). Monitora le uscite nei prossimi {daysRemaining} giorni per rimanere entro {remaining}.',
    comment_deficit: 'Attenzione al disavanzo: spese a quota {spent} a fronte di un budget di {budget}. Margine rimanente: {remaining}.',

    // Daily Activity Card
    daily_activity_title: 'Attività Uscite Ultimi 7 Giorni',
    daily_activity_desc: 'Ripartizione giornaliera delle spese della settimana',
    highest_day: 'Picco massimo',
    total_7days: 'Totale 7 giorni',
    days_short: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],

    // Reports Tab
    reports_title: 'REPORT E ANALISI',
    reports_subtitle: 'Riepilogo spese, categorie e archivio transazioni',
    filter_all: 'Tutto',
    filter_month: 'Mese',
    filter_year: 'Anno',
    filter_month_year: 'Filtra per Anno e Mese',
    filter_categories: 'Filtra Categorie',
    search_placeholder: 'Cerca per descrizione o categoria...',
    no_transactions_found: 'Nessuna transazione trovata per i filtri selezionati.',
    total_inflow: 'Entrate Totali',
    total_outflow: 'Uscite Totali',
    breakdown_by_category: 'Ripartizione per Categoria',
    transactions_ledger: 'Archivio Completo Transazioni',
    confirm_delete_prompt: 'Sei sicuro di voler eliminare questa transazione?',
    delete_action: 'Elimina',
    cancel_action: 'Annulla',

    // Add / Edit Transaction Modal
    modal_add_title_expense: 'REGISTRA USCITA',
    modal_add_title_income: 'REGISTRA ENTRATA',
    modal_edit_title_expense: 'MODIFICA USCITA',
    modal_edit_title_income: 'MODIFICA ENTRATA',
    modal_type_expense: '- USCITA',
    modal_type_income: '+ ENTRATA',
    modal_expense_desc: 'Detrae dal budget mensile',
    modal_income_desc: 'Incrementa il saldo disponibile',
    amount_label: 'Importo',
    description_label: 'Descrizione',
    description_label_optional: 'Descrizione (opzionale)',
    description_placeholder_expense: 'es. Spesa supermercato, Pranzo, Bolletta... (opzionale)',
    description_placeholder_income: 'es. Stipendio mensile, Bonifico, Rimborso... (opzionale)',
    category_label: 'Categoria',
    new_category: 'Nuova categoria...',
    add_category_btn: '+ Aggiungi',
    date_label: 'Data',
    location_label: 'Luogo / Negozio (opzionale)',
    location_placeholder: 'es. Esselunga, Bar Centrale, Amazon...',
    receipt_label: 'Scontrino / Ricevuta (opzionale)',
    upload_receipt: 'Carica foto o scontrino',
    remove_receipt: 'Rimuovi scontrino',
    btn_save_transaction: 'Salva Transazione',
    btn_delete_transaction: 'Elimina Transazione',

    // Unified Menu / Control Center
    control_center: 'CENTRO DI CONTROLLO',
    control_center_subtitle: 'Account, tema, budget, lingua e backup',
    account_sync: 'Account & Sincronizzazione Cloud',
    sign_in_google: 'Accedi con Google',
    sign_in_google_desc: 'Sincronizza istantaneamente su tutti i tuoi dispositivi',
    sign_out: 'Disconnetti',
    spending_limit_title: 'Limite Budget Mensile',
    spending_limit_desc: 'Soglia mensile usata per avvisarti quando le uscite salgono troppo',
    appearance_title: 'Aspetto & Tema Colore',
    language_title: 'Lingua Applicazione',
    backup_title: 'Backup Dati & Google Sheets',
    backup_desc: 'Esporta su Google Sheets, scarica file CSV o JSON',
    manage_data_btn: 'Gestisci Dati & Fogli',
    feedback_title: 'Feedback & Suggerimenti',
    feedback_desc: 'Invia idee o segnala bug per migliorare Stonks',
    send_feedback_btn: 'Invia Feedback',
    danger_zone: 'Area Pericolo',
    clear_data_btn: 'Ripristina e Cancella Dati',
    clear_data_confirm_1: 'Clicca per confermare la cancellazione',
    clear_data_confirm_2: 'Sicuro? Questa azione è irreversibile',

    // Language selector labels
    lang_it: 'Italiano',
    lang_en: 'English',
    lang_es: 'Español',
    lang_fr: 'Français',
    lang_de: 'Deutsch',
  },

  en: {
    tab_activity: 'Activity',
    tab_reports: 'Reports',
    tab_add: 'Add',
    menu: 'Menu',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    confirm_delete: 'Confirm deletion',
    edit: 'Edit',
    back: 'Back',

    record_expense: 'Expense',
    record_income: 'Income',

    status_system_ready: 'SYSTEM READY',
    status_budget_exceeded: 'BUDGET EXCEEDED',
    status_budget_near_limit: 'NEAR LIMIT',
    status_optimal: 'ALL GOOD',
    status_on_track: 'ON TRACK',
    status_warning: 'HIGH OUTFLOW',
    status_deficit: 'DEFICIT ALERT',

    badge_initialized: 'INITIALIZED',
    badge_limit_surpassed: 'LIMIT SURPASSED',
    badge_near_limit: 'BUDGET ALERT',
    badge_optimal: 'WITHIN BUDGET',
    badge_balanced: 'BALANCED',
    badge_high_outflow: 'HIGH OUTFLOW',
    badge_deficit: 'ACTIVE DEFICIT',

    net_balance: 'Net Balance',
    savings_margin: 'Savings Margin',
    deficit_margin: 'Deficit',
    transaction_singular: 'transaction',
    transaction_plural: 'transactions',

    monthly_budget_limit: 'Monthly Spending Limit',
    set_limit: 'Set Limit',
    change_limit: 'Change',
    budget_used: 'USED',
    remaining: 'remaining',
    over_limit: 'over limit',
    per_day_left: 'day left',

    income: 'Income',
    expenses: 'Expenses',
    deposits: 'deposits',
    avg_per_day: 'Avg',

    comment_no_transactions: 'Monthly budget set to {budget}. No transactions recorded this month: initial spending allowance of {dailyBudget}/day across {daysInMonth} days.',
    comment_budget_exceeded: 'Monthly spending limit of {budget} surpassed by {overBudget}! Total outlays reached {spent}. Trim discretionary expenses for the remaining {daysRemaining} days.',
    comment_budget_near_limit: 'Warning: you have consumed {percent}% of your {budget} budget ({spent} spent). Only {remaining} remains (~{dailyRemaining}/day for the next {daysRemaining} days).',
    comment_optimal: 'Excellent budget tracking on your {budget} ceiling: {spent} spent ({percent}%), with {remaining} remaining buffer (~{dailyRemaining}/day for the remaining {daysRemaining} days).',
    comment_balanced: 'Healthy balance within your {budget} budget: total outflow is {spent} ({percent}%). You still have {remaining} available (~{dailyRemaining}/day).',
    comment_warning: 'Outflow at {spent} against a {budget} monthly budget ({percent}% consumed). Monitor expenses closely over the next {daysRemaining} days to stay within {remaining}.',
    comment_deficit: 'Deficit warning: spending at {spent} against your {budget} ceiling. Remaining available: {remaining}.',

    daily_activity_title: 'Daily Spending Activity (Last 7 Days)',
    daily_activity_desc: 'Day-by-day distribution of recent outlays',
    highest_day: 'Peak day',
    total_7days: '7-day total',
    days_short: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],

    reports_title: 'REPORTS & ANALYTICS',
    reports_subtitle: 'Expense breakdowns, categories and full ledger',
    filter_all: 'All',
    filter_month: 'Month',
    filter_year: 'Year',
    filter_month_year: 'Filter by Year & Month',
    filter_categories: 'Filter Categories',
    search_placeholder: 'Search by description or category...',
    no_transactions_found: 'No transactions found for the selected filters.',
    total_inflow: 'Total Income',
    total_outflow: 'Total Expenses',
    breakdown_by_category: 'Breakdown by Category',
    transactions_ledger: 'Full Transaction Ledger',
    confirm_delete_prompt: 'Are you sure you want to delete this transaction?',
    delete_action: 'Delete',
    cancel_action: 'Cancel',

    modal_add_title_expense: 'RECORD EXPENSE',
    modal_add_title_income: 'RECORD INCOME',
    modal_edit_title_expense: 'EDIT EXPENSE',
    modal_edit_title_income: 'EDIT INCOME',
    modal_type_expense: '- EXPENSE',
    modal_type_income: '+ INCOME',
    modal_expense_desc: 'Deducts from monthly budget',
    modal_income_desc: 'Increases available balance',
    amount_label: 'Amount',
    description_label: 'Description',
    description_label_optional: 'Description (optional)',
    description_placeholder_expense: 'e.g. Supermarket, Coffee, Lunch... (optional)',
    description_placeholder_income: 'e.g. Monthly Salary, Transfer, Refund... (optional)',
    category_label: 'Category',
    new_category: 'New category...',
    add_category_btn: '+ Add',
    date_label: 'Date',
    location_label: 'Location / Merchant (optional)',
    location_placeholder: 'e.g. Starbucks, Amazon, Market...',
    receipt_label: 'Receipt / Invoice (optional)',
    upload_receipt: 'Upload receipt photo',
    remove_receipt: 'Remove receipt',
    btn_save_transaction: 'Save Transaction',
    btn_delete_transaction: 'Delete Transaction',

    control_center: 'CONTROL CENTER',
    control_center_subtitle: 'Account, theme, budget, language and backups',
    account_sync: 'Account & Cloud Sync',
    sign_in_google: 'Sign in with Google',
    sign_in_google_desc: 'Instant real-time sync across all your devices',
    sign_out: 'Sign Out',
    spending_limit_title: 'Monthly Spending Limit',
    spending_limit_desc: 'Target budget threshold used to alert when expenses run high',
    appearance_title: 'Appearance & Theme',
    language_title: 'App Language',
    backup_title: 'Data Backup & Google Sheets',
    backup_desc: 'Export to Google Sheets, download CSV or JSON files',
    manage_data_btn: 'Manage Data & Sheets',
    feedback_title: 'Feedback & Ideas',
    feedback_desc: 'Send suggestions or report bugs to improve Stonks',
    send_feedback_btn: 'Send Feedback',
    danger_zone: 'Danger Zone',
    clear_data_btn: 'Reset and Clear All Data',
    clear_data_confirm_1: 'Click again to confirm reset',
    clear_data_confirm_2: 'Are you sure? This cannot be undone',

    lang_it: 'Italiano',
    lang_en: 'English',
    lang_es: 'Español',
    lang_fr: 'Français',
    lang_de: 'Deutsch',
  },

  es: {
    tab_activity: 'Actividad',
    tab_reports: 'Informes',
    tab_add: 'Añadir',
    menu: 'Menú',
    close: 'Cerrar',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    confirm_delete: 'Confirmar eliminación',
    edit: 'Editar',
    back: 'Atrás',

    record_expense: 'Gasto',
    record_income: 'Ingreso',

    status_system_ready: 'SISTEMA LISTO',
    status_budget_exceeded: 'PRESUPUESTO SUPERADO',
    status_budget_near_limit: 'CERCA DEL LÍMITE',
    status_optimal: 'TODO EN ORDEN',
    status_on_track: 'POR BUEN CAMINO',
    status_warning: 'GASTOS ELEVADOS',
    status_deficit: 'DÉFICIT ACTIVO',

    badge_initialized: 'INICIALIZADO',
    badge_limit_surpassed: 'LÍMITE SUPERADO',
    badge_near_limit: 'ALERTA PRESUPUESTO',
    badge_optimal: 'DENTRO DEL PRESUPUESTO',
    badge_balanced: 'EQUILIBRADO',
    badge_high_outflow: 'ALTO GASTO',
    badge_deficit: 'DÉFICIT',

    net_balance: 'Saldo Neto',
    savings_margin: 'Margen de Ahorro',
    deficit_margin: 'Déficit',
    transaction_singular: 'transacción',
    transaction_plural: 'transacciones',

    monthly_budget_limit: 'Límite Mensual',
    set_limit: 'Definir Límite',
    change_limit: 'Cambiar',
    budget_used: 'USADO',
    remaining: 'restantes',
    over_limit: 'sobre el límite',
    per_day_left: 'día restantes',

    income: 'Ingresos',
    expenses: 'Gastos',
    deposits: 'depósitos',
    avg_per_day: 'Promedio',

    comment_no_transactions: 'Presupuesto mensual fijado en {budget}. Sin transacciones este mes: margen de {dailyBudget}/día para {daysInMonth} días.',
    comment_budget_exceeded: '¡Has superado tu presupuesto de {budget} por {overBudget}! Gastos totales de {spent}. Reduce gastos para los próximos {daysRemaining} días.',
    comment_budget_near_limit: 'Atención: has consumido el {percent}% de tu presupuesto de {budget} ({spent} gastados). Quedan solo {remaining} ({dailyRemaining}/día para {daysRemaining} días).',
    comment_optimal: 'Excelente control de tu presupuesto de {budget}: gastados {spent} ({percent}%), con un colchón de {remaining} ({dailyRemaining}/día para {daysRemaining} días).',
    comment_balanced: 'Presupuesto de {budget} equilibrado: gastos de {spent} ({percent}%). Dispones de {remaining} (~{dailyRemaining}/día).',
    comment_warning: 'Gastos en {spent} frente a un presupuesto de {budget} ({percent}% consumido). Modera los gastos en los próximos {daysRemaining} días.',
    comment_deficit: 'Alerta de déficit: gastos de {spent} frente a tu límite de {budget}. Margen restante: {remaining}.',

    daily_activity_title: 'Actividad de Gastos (Últimos 7 Días)',
    daily_activity_desc: 'Distribución diaria de los gastos recientes',
    highest_day: 'Pico más alto',
    total_7days: 'Total 7 días',
    days_short: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],

    reports_title: 'INFORMES Y ANÁLISIS',
    reports_subtitle: 'Desglose de gastos, categorías e historial',
    filter_all: 'Todo',
    filter_month: 'Mes',
    filter_year: 'Año',
    filter_month_year: 'Filtrar por Año y Mes',
    filter_categories: 'Filtrar Categorías',
    search_placeholder: 'Buscar por descripción o categoría...',
    no_transactions_found: 'No hay transacciones con los filtros seleccionados.',
    total_inflow: 'Ingresos Totales',
    total_outflow: 'Gastos Totales',
    breakdown_by_category: 'Desglose por Categoría',
    transactions_ledger: 'Historial Completo',
    confirm_delete_prompt: '¿Seguro que deseas eliminar esta transacción?',
    delete_action: 'Eliminar',
    cancel_action: 'Cancelar',

    modal_add_title_expense: 'REGISTRAR GASTO',
    modal_add_title_income: 'REGISTRAR INGRESO',
    modal_edit_title_expense: 'EDITAR GASTO',
    modal_edit_title_income: 'EDITAR INGRESO',
    modal_type_expense: '- GASTO',
    modal_type_income: '+ INGRESO',
    modal_expense_desc: 'Descuenta del presupuesto mensual',
    modal_income_desc: 'Aumenta el saldo disponible',
    amount_label: 'Importe',
    description_label: 'Descripción',
    description_label_optional: 'Descripción (opcional)',
    description_placeholder_expense: 'ej. Supermercado, Almuerzo, Café... (opcional)',
    description_placeholder_income: 'ej. Nómina, Transferencia, Devolución... (opcional)',
    category_label: 'Categoría',
    new_category: 'Nueva categoría...',
    add_category_btn: '+ Añadir',
    date_label: 'Fecha',
    location_label: 'Lugar / Tienda (opcional)',
    location_placeholder: 'ej. Mercadona, Amazon, Bar...',
    receipt_label: 'Recibo o Factura (opcional)',
    upload_receipt: 'Subir foto del recibo',
    remove_receipt: 'Quitar recibo',
    btn_save_transaction: 'Guardar Transacción',
    btn_delete_transaction: 'Eliminar Transacción',

    control_center: 'CENTRO DE CONTROL',
    control_center_subtitle: 'Cuenta, tema, presupuesto, idioma y respaldos',
    account_sync: 'Cuenta y Sincronización',
    sign_in_google: 'Iniciar sesión con Google',
    sign_in_google_desc: 'Sincronización en tiempo real en todos tus dispositivos',
    sign_out: 'Cerrar sesión',
    spending_limit_title: 'Límite de Gasto Mensual',
    spending_limit_desc: 'Presupuesto objetivo para avisar cuando los gastos suben',
    appearance_title: 'Apariencia y Tema',
    language_title: 'Idioma de la Aplicación',
    backup_title: 'Copia de Seguridad y Google Sheets',
    backup_desc: 'Exporta a Google Sheets o descarga archivos CSV y JSON',
    manage_data_btn: 'Gestionar Datos y Hojas',
    feedback_title: 'Comentarios e Ideas',
    feedback_desc: 'Envía ideas o reporta errores para mejorar Stonks',
    send_feedback_btn: 'Enviar Comentarios',
    danger_zone: 'Zona de Peligro',
    clear_data_btn: 'Restablecer y Borrar Datos',
    clear_data_confirm_1: 'Pulsa para confirmar el borrado',
    clear_data_confirm_2: '¿Seguro? Esta acción es irreversible',

    lang_it: 'Italiano',
    lang_en: 'English',
    lang_es: 'Español',
    lang_fr: 'Français',
    lang_de: 'Deutsch',
  },

  fr: {
    tab_activity: 'Activité',
    tab_reports: 'Rapports',
    tab_add: 'Ajouter',
    menu: 'Menu',
    close: 'Fermer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    confirm_delete: 'Confirmer la suppression',
    edit: 'Modifier',
    back: 'Retour',

    record_expense: 'Dépense',
    record_income: 'Revenu',

    status_system_ready: 'SYSTÈME PRÊT',
    status_budget_exceeded: 'BUDGET DÉPASSÉ',
    status_budget_near_limit: 'PROCHE DU PLAFOND',
    status_optimal: 'TOUT VA BIEN',
    status_on_track: 'SUR LA BONNE VOIE',
    status_warning: 'DÉPENSES ÉLEVÉES',
    status_deficit: 'DÉFICIT ACTIF',

    badge_initialized: 'INITIALISÉ',
    badge_limit_surpassed: 'PLAFOND DÉPASSÉ',
    badge_near_limit: 'ALERTE BUDGET',
    badge_optimal: 'DANS LE BUDGET',
    badge_balanced: 'ÉQUILIBRÉ',
    badge_high_outflow: 'FLUX ÉLEVÉ',
    badge_deficit: 'DÉFICIT',

    net_balance: 'Solde Net',
    savings_margin: 'Marge d’Épargne',
    deficit_margin: 'Déficit',
    transaction_singular: 'opération',
    transaction_plural: 'opérations',

    monthly_budget_limit: 'Plafond Mensuel',
    set_limit: 'Définir Plafond',
    change_limit: 'Modifier',
    budget_used: 'UTILISÉ',
    remaining: 'restants',
    over_limit: 'au-delà du plafond',
    per_day_left: 'jour restants',

    income: 'Revenus',
    expenses: 'Dépenses',
    deposits: 'versements',
    avg_per_day: 'Moyenne',

    comment_no_transactions: 'Budget mensuel fixé à {budget}. Aucune dépense enregistrée ce mois-ci: moyenne disponible de {dailyBudget}/jour sur {daysInMonth} jours.',
    comment_budget_exceeded: 'Vous avez dépassé votre budget de {budget} de {overBudget}! Total dépensé: {spent}. Réduisez les dépenses non essentielles pour les {daysRemaining} jours restants.',
    comment_budget_near_limit: 'Attention: vous avez atteint {percent}% de votre budget de {budget} ({spent} dépensés). Il ne reste que {remaining} ({dailyRemaining}/jour sur {daysRemaining} jours).',
    comment_optimal: 'Gestion idéale de votre budget de {budget}: dépensé {spent} ({percent}%), avec une réserve de {remaining} ({dailyRemaining}/jour pour les {daysRemaining} jours restants).',
    comment_balanced: 'Budget de {budget} équilibré: dépenses à hauteur de {spent} ({percent}%). Il vous reste {remaining} (~{dailyRemaining}/jour).',
    comment_warning: 'Dépenses à hauteur de {spent} sur un budget de {budget} ({percent}% consommé). Surveillez vos sorties sur les {daysRemaining} prochains jours.',
    comment_deficit: 'Alerte déficit: dépenses de {spent} face à votre budget de {budget}. Reste disponible: {remaining}.',

    daily_activity_title: 'Activité des Dépenses (7 Derniers Jours)',
    daily_activity_desc: 'Répartition journalière des dépenses récentes',
    highest_day: 'Pic maximal',
    total_7days: 'Total 7 jours',
    days_short: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],

    reports_title: 'RAPPORTS & ANALYSES',
    reports_subtitle: 'Répartition des dépenses, catégories et grand livre',
    filter_all: 'Tout',
    filter_month: 'Mois',
    filter_year: 'Année',
    filter_month_year: 'Filtrer par Année et Mois',
    filter_categories: 'Filtrer Catégories',
    search_placeholder: 'Rechercher par description ou catégorie...',
    no_transactions_found: 'Aucune transaction trouvée pour ces filtres.',
    total_inflow: 'Revenus Totaux',
    total_outflow: 'Dépenses Totales',
    breakdown_by_category: 'Répartition par Catégorie',
    transactions_ledger: 'Grand Livre des Opérations',
    confirm_delete_prompt: 'Êtes-vous sûr de vouloir supprimer cette transaction ?',
    delete_action: 'Supprimer',
    cancel_action: 'Annuler',

    modal_add_title_expense: 'ENREGISTRER DÉPENSE',
    modal_add_title_income: 'ENREGISTRER REVENU',
    modal_edit_title_expense: 'MODIFIER DÉPENSE',
    modal_edit_title_income: 'MODIFIER REVENU',
    modal_type_expense: '- DÉPENSE',
    modal_type_income: '+ REVENU',
    modal_expense_desc: 'Déduit du budget mensuel',
    modal_income_desc: 'Augmente le solde disponible',
    amount_label: 'Montant',
    description_label: 'Description',
    description_label_optional: 'Description (optionnelle)',
    description_placeholder_expense: 'ex. Supermarché, Restaurant, Café... (optionnelle)',
    description_placeholder_income: 'ex. Salaire mensuel, Virement, Remboursement... (optionnelle)',
    category_label: 'Catégorie',
    new_category: 'Nouvelle catégorie...',
    add_category_btn: '+ Ajouter',
    date_label: 'Date',
    location_label: 'Lieu / Magasin (optionnel)',
    location_placeholder: 'ex. Monoprix, Amazon, Café...',
    receipt_label: 'Reçu / Ticket (optionnel)',
    upload_receipt: 'Téléverser photo du ticket',
    remove_receipt: 'Supprimer le ticket',
    btn_save_transaction: 'Enregistrer Opération',
    btn_delete_transaction: 'Supprimer Opération',

    control_center: 'CENTRE DE CONTRÔLE',
    control_center_subtitle: 'Compte, thème, budget, langue et sauvegardes',
    account_sync: 'Compte & Synchronisation',
    sign_in_google: 'Se connecter avec Google',
    sign_in_google_desc: 'Synchronisation instantanée sur tous vos appareils',
    sign_out: 'Se déconnecter',
    spending_limit_title: 'Plafond de Dépenses Mensuel',
    spending_limit_desc: 'Budget cible pour vous alerter lorsque les dépenses grimpent',
    appearance_title: 'Apparence & Thème',
    language_title: 'Langue de l’Application',
    backup_title: 'Sauvegarde & Google Sheets',
    backup_desc: 'Exportez vers Google Sheets ou téléchargez des fichiers CSV / JSON',
    manage_data_btn: 'Gérer les Données',
    feedback_title: 'Avis & Suggestions',
    feedback_desc: 'Envoyez vos idées ou signalez des bugs pour améliorer Stonks',
    send_feedback_btn: 'Envoyer un Avis',
    danger_zone: 'Zone de Danger',
    clear_data_btn: 'Réinitialiser Toutes les Données',
    clear_data_confirm_1: 'Cliquez à nouveau pour confirmer',
    clear_data_confirm_2: 'Êtes-vous sûr ? Action irréversible',

    lang_it: 'Italiano',
    lang_en: 'English',
    lang_es: 'Español',
    lang_fr: 'Français',
    lang_de: 'Deutsch',
  },

  de: {
    tab_activity: 'Aktivität',
    tab_reports: 'Berichte',
    tab_add: 'Hinzufügen',
    menu: 'Menü',
    close: 'Schließen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    delete: 'Löschen',
    confirm_delete: 'Löschen bestätigen',
    edit: 'Bearbeiten',
    back: 'Zurück',

    record_expense: 'Ausgabe',
    record_income: 'Einnahme',

    status_system_ready: 'SYSTEM BEREIT',
    status_budget_exceeded: 'BUDGET ÜBERSCHRITTEN',
    status_budget_near_limit: 'NAHE AM LIMIT',
    status_optimal: 'ALLES BESTENS',
    status_on_track: 'AUF KURS',
    status_warning: 'HOHE AUSGABEN',
    status_deficit: 'DEFIZIT-WARNUNG',

    badge_initialized: 'BEREIT',
    badge_limit_surpassed: 'LIMIT ÜBERSCHRITTEN',
    badge_near_limit: 'BUDGET-WARNUNG',
    badge_optimal: 'IM BUDGET',
    badge_balanced: 'AUSGEGLICHEN',
    badge_high_outflow: 'HOHER ABFLUSS',
    badge_deficit: 'DEFIZIT',

    net_balance: 'Netto-Saldo',
    savings_margin: 'Sparquote',
    deficit_margin: 'Defizit',
    transaction_singular: 'Buchung',
    transaction_plural: 'Buchungen',

    monthly_budget_limit: 'Monatliches Budgetlimit',
    set_limit: 'Limit festlegen',
    change_limit: 'Ändern',
    budget_used: 'VERBRAUCHT',
    remaining: 'übrig',
    over_limit: 'über Limit',
    per_day_left: 'Tag übrig',

    income: 'Einnahmen',
    expenses: 'Ausgaben',
    deposits: 'Gutschriften',
    avg_per_day: 'Durchschnitt',

    comment_no_transactions: 'Monatsbudget auf {budget} festgelegt. Noch keine Buchungen diesen Monat: rechnerisch {dailyBudget}/Tag für {daysInMonth} Tage verfügbar.',
    comment_budget_exceeded: 'Budget von {budget} um {overBudget} überschritten! Gesamtausgaben bei {spent}. Schränken Sie Ausgaben für die verbleibenden {daysRemaining} Tage ein.',
    comment_budget_near_limit: 'Achtung: {percent}% Ihres Budgets von {budget} verbraucht ({spent} ausgegeben). Es verbleiben {remaining} ({dailyRemaining}/Tag für {daysRemaining} Tage).',
    comment_optimal: 'Hervorragende Budgeteinhaltung bei {budget}: {spent} ausgegeben ({percent}%), mit {remaining} Puffer ({dailyRemaining}/Tag für {daysRemaining} Tage).',
    comment_balanced: 'Budget von {budget} im Plan: Ausgaben bei {spent} ({percent}%). Noch {remaining} verfügbar (~{dailyRemaining}/Tag).',
    comment_warning: 'Ausgaben bei {spent} gegenüber {budget} Budget ({percent}% genutzt). Kontrollieren Sie Ausgaben in den nächsten {daysRemaining} Tagen.',
    comment_deficit: 'Defizitwarnung: Ausgaben bei {spent} im Vergleich zu {budget}. Verbleibender Spielraum: {remaining}.',

    daily_activity_title: 'Tägliche Ausgaben (Letzte 7 Tage)',
    daily_activity_desc: 'Tagesgenaue Übersicht der jüngsten Ausgaben',
    highest_day: 'Spitzentag',
    total_7days: '7-Tage-Summe',
    days_short: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],

    reports_title: 'BERICHTE & ANALYSEN',
    reports_subtitle: 'Kategorien, Ausgabenübersicht und Hauptbuch',
    filter_all: 'Alle',
    filter_month: 'Monat',
    filter_year: 'Jahr',
    filter_month_year: 'Nach Jahr & Monat filtern',
    filter_categories: 'Kategorien filtern',
    search_placeholder: 'Nach Beschreibung oder Kategorie suchen...',
    no_transactions_found: 'Keine Buchungen für die gewählten Filter gefunden.',
    total_inflow: 'Gesamteinnahmen',
    total_outflow: 'Gesamtausgaben',
    breakdown_by_category: 'Aufteilung nach Kategorie',
    transactions_ledger: 'Vollständiges Buchungsarchiv',
    confirm_delete_prompt: 'Möchten Sie diese Buchung wirklich löschen?',
    delete_action: 'Löschen',
    cancel_action: 'Abbrechen',

    modal_add_title_expense: 'AUSGABE ERFASSEN',
    modal_add_title_income: 'EINNAHME ERFASSEN',
    modal_edit_title_expense: 'AUSGABE BEARBEITEN',
    modal_edit_title_income: 'EINNAHME BEARBEITEN',
    modal_type_expense: '- AUSGABE',
    modal_type_income: '+ EINNAHME',
    modal_expense_desc: 'Wird vom Monatsbudget abgezogen',
    modal_income_desc: 'Erhöht das verfügbare Guthaben',
    amount_label: 'Betrag',
    description_label: 'Beschreibung',
    description_label_optional: 'Beschreibung (optional)',
    description_placeholder_expense: 'z.B. Supermarkt, Mittagessen, Kaffee... (optional)',
    description_placeholder_income: 'z.B. Monatsgehalt, Überweisung, Erstattung... (optional)',
    category_label: 'Kategorie',
    new_category: 'Neue Kategorie...',
    add_category_btn: '+ Hinzufügen',
    date_label: 'Datum',
    location_label: 'Ort / Händler (optional)',
    location_placeholder: 'z.B. Supermarkt, Amazon, Café...',
    receipt_label: 'Beleg / Quittung (optional)',
    upload_receipt: 'Belegfoto hochladen',
    remove_receipt: 'Beleg entfernen',
    btn_save_transaction: 'Buchung Speichern',
    btn_delete_transaction: 'Buchung Löschen',

    control_center: 'KONTROLLZENTRUM',
    control_center_subtitle: 'Konto, Design, Budget, Sprache und Backups',
    account_sync: 'Konto & Cloud-Synchronisierung',
    sign_in_google: 'Mit Google anmelden',
    sign_in_google_desc: 'Sofortige Echtzeit-Synchronisierung auf all Ihren Geräten',
    sign_out: 'Abmelden',
    spending_limit_title: 'Monatliches Ausgabenlimit',
    spending_limit_desc: 'Zielbudget zur Warnung bei überhöhten Ausgaben',
    appearance_title: 'Erscheinungsbild & Design',
    language_title: 'App-Sprache',
    backup_title: 'Datensicherung & Google Sheets',
    backup_desc: 'Exportieren Sie nach Google Sheets oder laden Sie CSV / JSON herunter',
    manage_data_btn: 'Daten & Tabellen verwalten',
    feedback_title: 'Feedback & Ideen',
    feedback_desc: 'Ideen senden oder Fehler melden, um Stonks zu verbessern',
    send_feedback_btn: 'Feedback Senden',
    danger_zone: 'Gefahrenzone',
    clear_data_btn: 'Alle Daten Zurücksetzen',
    clear_data_confirm_1: 'Erneut klicken zum Bestätigen',
    clear_data_confirm_2: 'Sind Sie sicher? Dies kann nicht rückgängig gemacht werden',

    lang_it: 'Italiano',
    lang_en: 'English',
    lang_es: 'Español',
    lang_fr: 'Français',
    lang_de: 'Deutsch',
  },
};

export type TranslationKey = keyof typeof translations.it;

export function getTranslation(lang: SupportedLanguage, key: TranslationKey, params?: Record<string, any>): string {
  const dict = translations[lang] || translations.it;
  let text = (dict as any)[key] || (translations.it as any)[key] || key;

  if (params) {
    Object.entries(params).forEach(([paramKey, val]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
    });
  }
  return text;
}

// React Hook for easy multi-language support across all components
export function useLanguage() {
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(getStoredLanguage);

  useEffect(() => {
    const handleLangChange = (e: any) => {
      if (e.detail) {
        setCurrentLanguageState(e.detail);
      }
    };
    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLangChange);
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLangChange);
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    saveStoredLanguage(lang);
    setCurrentLanguageState(lang);
  };

  const t = (key: TranslationKey, params?: Record<string, any>) => {
    return getTranslation(currentLanguage, key, params);
  };

  return {
    language: currentLanguage,
    setLanguage,
    t,
    supportedLanguages: SUPPORTED_LANGUAGES,
    localizeCategory: (cat?: string | null) => localizeCategory(cat, currentLanguage),
    defaultCategories: getDefaultCategories(currentLanguage),
  };
}

export interface CategoryDef {
  key: string;
  type: 'expense' | 'income';
  names: Record<SupportedLanguage, string>;
  matchAliases: string[];
}

export const CATEGORY_DEFINITIONS: CategoryDef[] = [
  // Expense categories
  {
    key: 'groceries',
    type: 'expense',
    names: {
      it: 'Alimentari',
      en: 'Groceries',
      es: 'Alimentación',
      fr: 'Alimentation',
      de: 'Lebensmittel',
    },
    matchAliases: ['groceries', 'alimentari', 'spesa', 'spesa alimentare', 'supermercato', 'supermarket', 'grocery', 'comestibles', 'nourriture'],
  },
  {
    key: 'dining',
    type: 'expense',
    names: {
      it: 'Ristoranti & Bar',
      en: 'Dining Out',
      es: 'Restaurantes & Bares',
      fr: 'Restaurants & Sorties',
      de: 'Restaurant & Bars',
    },
    matchAliases: ['dining out', 'dining', 'ristoranti & bar', 'ristorante', 'ristoranti', 'bar', 'cena', 'pranzo', 'caffè', 'restaurante', 'restaurant'],
  },
  {
    key: 'transport',
    type: 'expense',
    names: {
      it: 'Trasporti',
      en: 'Transport',
      es: 'Transporte',
      fr: 'Transports',
      de: 'Transport & Mobilität',
    },
    matchAliases: ['transport', 'trasporti', 'transporte', 'transports', 'carburante', 'benzina', 'treno', 'metro', 'bus', 'taxi', 'uber'],
  },
  {
    key: 'housing',
    type: 'expense',
    names: {
      it: 'Casa & Affitto',
      en: 'Housing',
      es: 'Vivienda',
      fr: 'Logement',
      de: 'Wohnen & Miete',
    },
    matchAliases: ['housing', 'casa', 'casa & affitto', 'affitto', 'vivienda', 'logement', 'miete', 'mutuo', 'rent'],
  },
  {
    key: 'bills',
    type: 'expense',
    names: {
      it: 'Bollette & Utenze',
      en: 'Bills & Utilities',
      es: 'Facturas & Servicios',
      fr: 'Factures & Services',
      de: 'Rechnungen & Fixkosten',
    },
    matchAliases: ['bills & utilities', 'bills', 'bollette & utenze', 'bollette', 'utenze', 'facturas', 'factures', 'rechnungen', 'utilities'],
  },
  {
    key: 'entertainment',
    type: 'expense',
    names: {
      it: 'Svago & Tempo Libero',
      en: 'Entertainment',
      es: 'Ocio & Entretenimiento',
      fr: 'Loisirs & Divertissement',
      de: 'Freizeit & Unterhaltung',
    },
    matchAliases: ['entertainment', 'svago & tempo libero', 'svago', 'tempo libero', 'ocio', 'loisirs', 'freizeit', 'cinema', 'hobby', 'gaming'],
  },
  {
    key: 'health',
    type: 'expense',
    names: {
      it: 'Salute & Benessere',
      en: 'Health',
      es: 'Salud & Bienestar',
      fr: 'Santé & Bien-être',
      de: 'Gesundheit & Pflege',
    },
    matchAliases: ['health', 'salute & benessere', 'salute', 'farmacia', 'medico', 'salud', 'santé', 'gesundheit', 'wellness', 'pharmacy'],
  },
  {
    key: 'shopping',
    type: 'expense',
    names: {
      it: 'Shopping & Acquisti',
      en: 'Shopping',
      es: 'Compras',
      fr: 'Shopping',
      de: 'Einkaufen & Shopping',
    },
    matchAliases: ['shopping & acquisti', 'shopping', 'acquisti', 'compras', 'einkaufen', 'abbigliamento', 'vestiti', 'clothes'],
  },
  {
    key: 'other',
    type: 'expense',
    names: {
      it: 'Altro',
      en: 'Other',
      es: 'Otros',
      fr: 'Autre',
      de: 'Sonstiges',
    },
    matchAliases: ['other', 'altro', 'varie', 'otros', 'autre', 'sonstiges', 'miscellaneous', 'misc'],
  },

  // Income categories
  {
    key: 'salary',
    type: 'income',
    names: {
      it: 'Stipendio',
      en: 'Salary',
      es: 'Sueldo',
      fr: 'Salaire',
      de: 'Gehalt',
    },
    matchAliases: ['salary', 'stipendio', 'sueldo', 'salaire', 'gehalt', 'busta paga', 'payroll'],
  },
  {
    key: 'transfer',
    type: 'income',
    names: {
      it: 'Bonifico',
      en: 'Transfer',
      es: 'Transferencia',
      fr: 'Virement',
      de: 'Überweisung',
    },
    matchAliases: ['transfer', 'bonifico', 'transferencia', 'virement', 'überweisung', 'giroconto', 'wire'],
  },
  {
    key: 'investments',
    type: 'income',
    names: {
      it: 'Investimenti',
      en: 'Investments',
      es: 'Inversiones',
      fr: 'Investissements',
      de: 'Investitionen',
    },
    matchAliases: ['investments', 'investimenti', 'inversiones', 'investissements', 'investitionen', 'dividendi', 'crypto', 'stocks'],
  },
  {
    key: 'refund',
    type: 'income',
    names: {
      it: 'Rimborso',
      en: 'Refund',
      es: 'Reembolso',
      fr: 'Remboursement',
      de: 'Rückerstattung',
    },
    matchAliases: ['refund', 'rimborso', 'reembolso', 'remboursement', 'rückerstattung', 'reso'],
  },
  {
    key: 'freelance',
    type: 'income',
    names: {
      it: 'Freelance',
      en: 'Freelance',
      es: 'Freelance',
      fr: 'Freelance',
      de: 'Freiberuflich',
    },
    matchAliases: ['freelance', 'freiberuflich', 'consulenza', 'fattura', 'partita iva'],
  },
  {
    key: 'bonus',
    type: 'income',
    names: {
      it: 'Bonus & Premi',
      en: 'Bonus',
      es: 'Bonificación',
      fr: 'Prime & Bonus',
      de: 'Bonus & Prämie',
    },
    matchAliases: ['bonus & premi', 'bonus', 'premi', 'bonificación', 'prime', 'prämie', 'regalo', 'premio'],
  },
];

export function getDefaultCategories(lang: SupportedLanguage = 'it'): { expense: string[]; income: string[] } {
  const expense = CATEGORY_DEFINITIONS
    .filter((c) => c.type === 'expense')
    .map((c) => c.names[lang] || c.names.it);

  const income = CATEGORY_DEFINITIONS
    .filter((c) => c.type === 'income')
    .map((c) => c.names[lang] || c.names.it);

  return { expense, income };
}

export function localizeCategory(rawCat?: string | null, targetLang?: SupportedLanguage): string {
  if (!rawCat || !rawCat.trim()) {
    const lang = targetLang || getStoredLanguage();
    return lang === 'it' ? 'Altro' : 'Other';
  }

  const lang = targetLang || getStoredLanguage();
  const trimmed = rawCat.trim();
  const lower = trimmed.toLowerCase();

  // Find matching definition by canonical key, alias, or any translation name
  const match = CATEGORY_DEFINITIONS.find((def) => {
    if (def.key === lower) return true;
    if (def.matchAliases.includes(lower)) return true;
    return Object.values(def.names).some((name) => name.toLowerCase() === lower);
  });

  if (match) {
    return match.names[lang] || match.names.it;
  }

  return trimmed;
}
