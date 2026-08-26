const modules = [
  { key: "dashboard", label: "Dashboard", icon: "DB" },
  { key: "calendar", label: "Calendario", icon: "CA" },
  { key: "brands", label: "Marcas", icon: "BR" },
  { key: "brand-config", label: "Config. de marca", icon: "BR" },
  { key: "work-orders", label: "Órdenes de trabajo", icon: "OT" },
  { key: "production-planner", label: "Planificador de producción", icon: "PP" },
  { key: "notifications", label: "Notificaciones", icon: "NT" },
  { key: "productions", label: "Producciones", icon: "PR" },
  { key: "content", label: "Contenido", icon: "CO" },
  { key: "assets", label: "Assets / Canva", icon: "CA" },
  { key: "copywriting", label: "Copywriting IA", icon: "CP" },
  { key: "creativity", label: "Creatividad IA", icon: "IA" },
  { key: "reports", label: "Reportería", icon: "RP" },
  { key: "team", label: "Equipo", icon: "EQ" },
  { key: "client-portal", label: "Portal cliente", icon: "CL" },
  { key: "profile", label: "Perfil", icon: "PF" },
  { key: "settings", label: "Admin", icon: "AD" },
];

const ALL_BRANDS_ID = "all-brands";
const OPERATIONS_MODE = true;
const ENABLE_AI_ASSISTANT = false;
const APP_BUILD_MARKER = "phase-debug-2026-07-24-v7d-fix-next-status";
const phaseReorder = globalThis.LumenPhaseReorder;
const DEBUG_INTERACTIONS =
  typeof window !== "undefined" &&
  (new URLSearchParams(window.location.search).has("debugInteractions") || window.localStorage?.getItem("lumen_debug_interactions") === "1");
const aiModuleKeys = ["copywriting", "creativity"];
const managementModuleKeys = ["dashboard", "work-orders", "calendar", "brands", "production-planner", "team", "reports", "notifications", "profile", "settings"];
const operationalUserModuleKeys = ["dashboard", "work-orders", "calendar", "profile"];
const operationalModuleKeys = managementModuleKeys;
const operationalNavGroups = [
  { label: "Operación", keys: ["dashboard", "work-orders", "calendar", "brands"] },
  { label: "Gestión", keys: ["production-planner", "team", "reports", "notifications"] },
  { label: "Sistema", keys: ["profile", "settings"] },
];
let supabaseClient = null;

function iconSvg(name, className = "ui-icon") {
  const icons = {
    dashboard: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    "work-orders": '<svg viewBox="0 0 24 24"><path d="M9 5h6"/><path d="M9 12h6"/><path d="M9 17h4"/><path d="M8 3h8l2 2v16H6V5l2-2z"/></svg>',
    notifications: '<svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
    reports: '<svg viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><rect x="7" y="11" width="3" height="5" rx="1"/><rect x="12" y="7" width="3" height="9" rx="1"/><rect x="17" y="9" width="3" height="7" rx="1"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>',
    "production-planner": '<svg viewBox="0 0 24 24"><path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/><path d="M8 3v18"/><path d="M16 3v18"/></svg>',
    team: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15 16.5a5 5 0 0 1 6 3.5"/></svg>',
    profile: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 3.1a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 3.1h5l.3-3.1a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z"/></svg>',
    ai: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></svg>',
    alert: '<svg viewBox="0 0 24 24"><path d="M12 3l10 18H2L12 3z"/><path d="M12 9v5"/><path d="M12 18h.01"/></svg>',
    time: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    archive: '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M6 7v13h12V7"/><path d="M8 3h8l2 4H6l2-4z"/><path d="M10 12h4"/></svg>',
    brand: '<svg viewBox="0 0 24 24"><path d="M4 7l8-4 8 4v10l-8 4-8-4V7z"/><path d="M12 3v18"/><path d="M4 7l8 4 8-4"/></svg>',
    brands: '<svg viewBox="0 0 24 24"><path d="M4 7l8-4 8 4v10l-8 4-8-4V7z"/><path d="M12 3v18"/><path d="M4 7l8 4 8-4"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>',
    grip: '<svg viewBox="0 0 24 24"><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>',
  };
  return `<span class="${className}" aria-hidden="true">${icons[name] || icons.dashboard}</span>`;
}

const dataState = {
  mode: "demo",
  loading: true,
  initialized: false,
  error: "",
  session: null,
  profile: null,
  clientsReady: false,
  brandsReady: false,
  brandNotificationRecipientsReady: false,
  emailNotificationsReady: true,
  workOrderPhasesReady: false,
  phaseCommentsReady: true,
  phaseComments: [],
  lastEmailFunctionError: null,
  productionPlannerReady: true,
  weeklyDigestRunsReady: true,
  notificationRulesReady: true,
};

const clients = [
  { id: "continental", name: "Continental Motores" },
  { id: "danone", name: "Danone Guatemala" },
  { id: "solarsa", name: "Solarsa" },
  { id: "wash-go", name: "Wash and Go" },
  { id: "lumen", name: "Lumen" },
];

const brandConfigSections = [
  {
    key: "identity",
    title: "Identidad",
    description: "Logo, colores, personalidad y promesa de marca.",
    fields: [
      ["positioning", "textarea", "Posicionamiento", "Que lugar ocupa la marca y por que debe importarle al cliente."],
      ["personality", "textarea", "Personalidad", "Como se comporta la marca cuando comunica."],
      ["promise", "input", "Promesa", "La idea simple que debe sostener todo el contenido."],
      ["brandRisks", "textarea", "Riesgos de marca", "Temas, claims o territorios que requieren cuidado."],
    ],
  },
  {
    key: "channels",
    title: "Canales",
    description: "Perfiles activos, objetivos por plataforma y links externos.",
    fields: [
      ["channelObjective", "textarea", "Objetivo por canal", "Que debe lograr Facebook, Instagram, TikTok, YouTube o Spotify."],
      ["cadence", "input", "Frecuencia", "Ej: 10 posts/mes, 3 stories/semana, 2 reels/semana."],
      ["primaryKpis", "input", "KPIs principales", "Alcance, engagement, leads, views, clicks u otros."],
      ["externalLinks", "textarea", "Links externos", "Perfiles, folders, documentos y accesos relevantes."],
    ],
  },
  {
    key: "services",
    title: "Servicios",
    description: "Publicacion, comunidad, pauta, reportería y entregables activos.",
    fields: [
      ["activeServices", "input", "Servicios activos", "Servicios contratados o gestionados por Lumen."],
      ["deliverables", "textarea", "Entregables", "Que se entrega cada mes y en que formato."],
      ["communityRules", "textarea", "Reglas de comunidad", "Como responder, escalar y cerrar conversaciones."],
      ["reportingRules", "textarea", "Reglas de reportería", "Periodicidad, fuentes y metrica norte."],
    ],
  },
  {
    key: "audiences",
    title: "Audiencias",
    description: "Segmentos, dolores, motivadores y objeciones frecuentes.",
    fields: [
      ["primaryAudience", "textarea", "Audiencia principal", "Quien compra, influye o aprueba."],
      ["painPoints", "textarea", "Dolores", "Problemas reales que el contenido debe reconocer."],
      ["motivators", "textarea", "Motivadores", "Que hace que la audiencia actue."],
      ["objections", "textarea", "Objeciones", "Dudas o frenos frecuentes antes de convertir."],
    ],
  },
  {
    key: "voice",
    title: "Voz IA",
    description: "Tono, reglas, frases aprobadas/prohibidas y ejemplos reales.",
    fields: [
      ["tone", "textarea", "Tono de voz", "Como debe sonar el copy de la marca."],
      ["approvedPhrases", "textarea", "Frases aprobadas", "Expresiones que si se pueden repetir."],
      ["bannedPhrases", "textarea", "Frases prohibidas", "Claims, palabras o tonos que se deben evitar."],
      ["examples", "textarea", "Ejemplos reales", "Captions o guiones aprobados para entrenar el criterio."],
      ["geminiModel", "input", "Gemini model", "Modelo recomendado para esta marca."],
      ["systemPrompt", "textarea", "System prompt", "Instruccion base que usara IA en contenido e ideas."],
    ],
  },
  {
    key: "assets",
    title: "Assets",
    description: "Canva folder, plantillas, referencias visuales y piezas aprobadas.",
    fields: [
      ["canvaFolder", "input", "Canva folder", "Folder o link maestro de Canva."],
      ["templates", "textarea", "Plantillas", "Plantillas clave por formato."],
      ["visualRules", "textarea", "Reglas visuales", "Uso de logo, producto, color, empaque, fondos y disclaimers."],
      ["referenceLinks", "textarea", "Referencias", "Links de moodboards, benchmarks o ejemplos aprobados."],
    ],
  },
  {
    key: "governance",
    title: "Gobernanza",
    description: "Aprobadores, SLA, riesgos, notas legales y bitacora.",
    fields: [
      ["approvers", "input", "Aprobadores", "Personas que aprueban internamente y del lado cliente."],
      ["sla", "input", "SLA", "Tiempo esperado para revisión, cambios y aprobación."],
      ["legalNotes", "textarea", "Notas legales", "Restricciones, disclaimers o revisiones obligatorias."],
      ["escalation", "textarea", "Escalamiento", "Cuando una pieza debe subir a dirección o cliente."],
    ],
  },
];

const brandChannels = [
  { brandId: "silk-gt", channel: "Instagram", handle: "@silkguatemala", objective: "Educacion + venta", status: "Activo" },
  { brandId: "silk-gt", channel: "Facebook", handle: "Silk Guatemala", objective: "Alcance + comunidad", status: "Activo" },
  { brandId: "jim-gt", channel: "TikTok", handle: "@jimgt", objective: "Leads + awareness", status: "Activo" },
];

const brandAuditLog = [
  { brandId: "silk-gt", action: "Gemini config actualizada", actor: "Giuliana", date: "2026-04-28 11:22" },
  { brandId: "silk-gt", action: "Canal Instagram validado", actor: "Valeria", date: "2026-04-27 16:10" },
  { brandId: "jim-gt", action: "Servicio ManyChat activado", actor: "Diego", date: "2026-04-26 13:40" },
];

const brands = [
  {
    id: "repuestos-continental",
    clientId: "continental",
    name: "Repuestos",
    shortName: "Repuestos",
    color: "#2d2d2d",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta Meta"],
    monthlyGoal: 10,
    canvaFolder: "Continental / Repuestos",
  },
  {
    id: "talleres-continental",
    clientId: "continental",
    name: "Talleres",
    shortName: "Talleres",
    color: "#49ee8c",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta Meta"],
    monthlyGoal: 10,
    canvaFolder: "Continental / Talleres",
  },
  {
    id: "usados-continental",
    clientId: "continental",
    name: "Usados",
    shortName: "Usados",
    color: "#5d5d56",
    platforms: ["Facebook", "Instagram"],
    services: ["Pauta Meta"],
    monthlyGoal: 0,
    canvaFolder: "Continental / Usados",
  },
  {
    id: "seguros-continental",
    clientId: "continental",
    name: "Seguros y Fianzas Continental",
    shortName: "Seguros",
    color: "#49ee8c",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Pauta Meta"],
    monthlyGoal: 5,
    canvaFolder: "Continental / Seguros",
  },
  {
    id: "jim-gt",
    clientId: "continental",
    name: "JIM GT",
    shortName: "JIM GT",
    color: "#c84e48",
    platforms: ["TikTok"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta TikTok", "ManyChat"],
    monthlyGoal: 10,
    canvaFolder: "Continental / JIM",
  },
  {
    id: "leap-gt",
    clientId: "continental",
    name: "Leap GT",
    shortName: "Leap",
    color: "#3f7060",
    platforms: ["TikTok"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta TikTok", "ManyChat"],
    monthlyGoal: 10,
    canvaFolder: "Continental / Leap",
  },
  {
    id: "volkswagen-gt",
    clientId: "continental",
    name: "Volkswagen GT",
    shortName: "Volkswagen",
    color: "#7356a6",
    platforms: ["TikTok"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta TikTok", "ManyChat"],
    monthlyGoal: 10,
    canvaFolder: "Continental / VW",
  },
  {
    id: "camiones-vw-gt",
    clientId: "continental",
    name: "Camiones VW GT",
    shortName: "Camiones VW",
    color: "#b7791f",
    platforms: ["TikTok"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta TikTok", "ManyChat"],
    monthlyGoal: 10,
    canvaFolder: "Continental / Camiones",
  },
  {
    id: "bestune-gt",
    clientId: "continental",
    name: "Bestune GT",
    shortName: "Bestune",
    color: "#5d5d56",
    platforms: ["TikTok"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta TikTok", "ManyChat"],
    monthlyGoal: 10,
    canvaFolder: "Continental / Bestune",
  },
  {
    id: "212-continental",
    clientId: "continental",
    name: "212",
    shortName: "212",
    color: "#2d2d2d",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta Meta"],
    monthlyGoal: 10,
    canvaFolder: "Continental / 212",
  },
  {
    id: "wuling-continental",
    clientId: "continental",
    name: "Wuling",
    shortName: "Wuling",
    color: "#166274",
    platforms: ["Facebook", "Instagram", "TikTok"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta Meta"],
    monthlyGoal: 10,
    canvaFolder: "Continental / Wuling",
  },
  {
    id: "danone-gt",
    clientId: "danone",
    name: "Danone",
    shortName: "Danone",
    color: "#3f7060",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta Meta"],
    monthlyGoal: 10,
    canvaFolder: "Danone GT / Danone",
  },
  {
    id: "silk-gt",
    clientId: "danone",
    name: "Silk",
    shortName: "Silk",
    color: "#49ee8c",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta Meta"],
    monthlyGoal: 10,
    canvaFolder: "Danone GT / Silk",
  },
  {
    id: "danonino-gt",
    clientId: "danone",
    name: "Danonino",
    shortName: "Danonino",
    color: "#c84e48",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta Meta"],
    monthlyGoal: 10,
    canvaFolder: "Danone GT / Danonino",
  },
  {
    id: "bonafont-gt",
    clientId: "danone",
    name: "Bonafont",
    shortName: "Bonafont",
    color: "#166274",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta Meta"],
    monthlyGoal: 10,
    canvaFolder: "Danone GT / Bonafont",
  },
  {
    id: "solarsa-gt",
    clientId: "solarsa",
    name: "Solarsa GT",
    shortName: "Solarsa",
    color: "#b7791f",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta Meta"],
    monthlyGoal: 10,
    canvaFolder: "Solarsa GT",
  },
  {
    id: "wash-and-go-gt",
    clientId: "wash-go",
    name: "Wash and Go GT",
    shortName: "Wash and Go",
    color: "#2d2d2d",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta Meta"],
    monthlyGoal: 9,
    canvaFolder: "Wash and Go GT",
  },
  {
    id: "lumen-podcast",
    clientId: "lumen",
    name: "Lumen Podcast",
    shortName: "Podcast",
    color: "#7356a6",
    platforms: ["YouTube", "Spotify"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta Google"],
    monthlyGoal: 11,
    canvaFolder: "Lumen / Podcast",
  },
  {
    id: "lumen-agencia",
    clientId: "lumen",
    name: "Lumen Agencia",
    shortName: "Agencia",
    color: "#3f7060",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Comunidad", "Reporteria"],
    monthlyGoal: 4,
    canvaFolder: "Lumen / Agencia",
  },
  {
    id: "constructivos",
    clientId: "lumen",
    name: "Constructivos",
    shortName: "Constructivos",
    color: "#49ee8c",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Comunidad", "Reporteria"],
    monthlyGoal: 8,
    canvaFolder: "Lumen / Constructivos",
  },
  {
    id: "rijk-zwaan",
    clientId: "lumen",
    name: "Rijk Zwaan",
    shortName: "Rijk Zwaan",
    color: "#3f7060",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Comunidad", "Reporteria"],
    monthlyGoal: 10,
    canvaFolder: "Lumen / Rijk Zwaan",
  },
  {
    id: "iooi",
    clientId: "lumen",
    name: "IOOI",
    shortName: "IOOI",
    color: "#7356a6",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Comunidad", "Reporteria"],
    monthlyGoal: 10,
    canvaFolder: "Lumen / IOOI",
  },
  {
    id: "lumen-proyectos",
    clientId: "lumen",
    name: "Proyectos",
    shortName: "Proyectos",
    color: "#7356a6",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Produccion", "Reporteria"],
    monthlyGoal: 8,
    canvaFolder: "Lumen / Proyectos",
  },
  {
    id: "lumen-pitch",
    clientId: "lumen",
    name: "Pitch",
    shortName: "Pitch",
    color: "#2d2d2d",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Produccion", "Desarrollo"],
    monthlyGoal: 6,
    canvaFolder: "Lumen / Pitch",
  },
];

const officialBrandAbbreviations = {
  "volkswagen-gt": "VW",
  volkswagen: "VW",
  "camiones-vw-gt": "CVW",
  "volkswagen-camiones": "CVW",
  bestune: "BTN",
  "bestune-gt": "BTN",
  jim: "JIM",
  "jim-gt": "JIM",
  leap: "LPM",
  "leap-gt": "LPM",
  "leap-motors": "LPM",
  "talleres-continental": "TCM",
  talleres: "TCM",
  "repuestos-continental": "RCM",
  repuestos: "RCM",
  "usados-continental": "USM",
  usados: "USM",
  "seguros-continental": "SCM",
  seguros: "SCM",
  "danone-gt": "DNE",
  danone: "DNE",
  "danonino-gt": "DNO",
  danonino: "DNO",
  "silk-gt": "SLK",
  silk: "SLK",
  "bonafont-gt": "BNF",
  bonafont: "BNF",
  "fundacion-listo": "LST",
  "solarsa-gt": "SLS",
  solarsa: "SLS",
  "wash-and-go-gt": "WNG",
  "wash-go": "WNG",
  "wash-and-go": "WNG",
  "212-continental": "212",
  "wuling-continental": "WLG",
  "rijk-zwaan": "RJZ",
  iooi: "IOOI",
  constructivos: "CST",
};

const users = loadStoredCollection("lumen_users_v1", []);
const brandNotificationRecipients = loadStoredCollection("lumen_brand_notification_recipients_v1", []);
const emailNotifications = [];
const weeklyDigestRuns = [];
const notificationRules = [];

const demoWorkOrdersResetVersion = "2026-05-26-clean-all-test-work-orders";
if (localStorage.getItem("lumen_work_orders_reset_version") !== demoWorkOrdersResetVersion) {
  localStorage.removeItem("lumen_work_orders_v1");
  localStorage.setItem("lumen_work_orders_reset_version", demoWorkOrdersResetVersion);
}

let workOrders = [];

const initialWorkOrders = workOrders.map((order) => ({ ...order }));
workOrders = loadStoredCollection("lumen_work_orders_v1", initialWorkOrders);

const notificationRuleCatalog = [
  {
    id: "assignment",
    title: "Nueva OT creada",
    channel: "Correo + aviso dentro del sistema",
    recipients: "Destinatarios por marca / respaldo responsables",
    enabled: true,
  },
  {
    id: "deadline-24h",
    title: "Deadline en 24h",
    channel: "Correo",
    recipients: "Responsables + Dirección/Cuentas",
    enabled: true,
  },
  {
    id: "work-order-edits",
    title: "Cambios y subtareas en OT",
    channel: "Resumen diario",
    recipients: "Destinatarios por marca / respaldo responsables",
    enabled: true,
  },
  {
    id: "phase-assignment",
    title: "Responsables por fase",
    channel: "Correo + aviso dentro del sistema",
    recipients: "Responsables asignados a cada fase",
    enabled: true,
  },
  {
    id: "urgent-alert",
    title: "Alerta de urgencia",
    channel: "Correo prioritario",
    recipients: "Dirección y Cuentas",
    enabled: true,
  },
  {
    id: "overdue",
    title: "OT vencida",
    channel: "Correo + aviso dentro del sistema",
    recipients: "Responsables + creador + Dirección/Cuentas",
    enabled: true,
  },
  {
    id: "weekly-digest",
    title: "Digest semanal personal",
    channel: "Correo",
    recipients: "Cada persona interna con sus OTs asignadas",
    enabled: true,
  },
  {
    id: "daily-activity-digest",
    title: "Resumen diario de actividad",
    channel: "Un correo al final del día",
    recipients: "Responsables y creadores de OTs con cambios",
    enabled: true,
  },
];

const weeklyDigestConfig = {
  day: "Lunes",
  time: "08:00",
  timezone: "America/Mexico_City",
  subject: "Lumen Workspace - tus OTs de la semana",
};

const workOrderManagerRoles = ["admin", "directora", "direccion", "dirección", "jefe", "jefatura", "cuentas", "coordinador", "coordinacion", "coordinación", "ejecutivo"];
const workOrderCreatorRoles = workOrderManagerRoles;
const createdOrdersDashboardRoles = new Set(["admin", "cuentas", "directora", "direccion"]);
const calendarManagementRoles = new Set(["admin", "directora", "director", "direccion", "cuentas"]);
const workOrderMaterialRoles = ["admin", "directora", "cuentas", "generador", "creativo", "disenador", "editor"];
const urgencyManagerRoles = ["admin", "directora", "director", "direccion", "dirección", "jefe", "jefatura", "cuentas", "coordinador", "coordinadora", "coordinacion", "coordinación", "ejecutivo", "ejecutiva"];
const notificationModuleRoles = new Set([
  "admin",
  "directora",
  "cuentas",
  "ejecutivo",
  "operaciones",
  "medios",
  "pauta",
  "community",
  "creativo",
  "disenador",
  "editor",
  "generador",
]);
const productionPlannerRoles = [
  "admin",
  "direccion",
  "director",
  "directora",
  "cuentas",
  "cuenta",
  "coordinador",
  "coordinadora",
  "coordinacion",
  "coordinación",
  "ejecutivo",
  "ejecutiva",
  "produccion",
  "producción",
  "digital lead",
  "project manager",
  "manager",
];
const productionPlannerEmails = ["guzcategui@grupolumen.com"];
const productionPlannerTalentOptions = ["Modelo", "Vendedor", "No", "Por definir"];
const productionPlannerMatrixStatusOptions = ["Pendiente", "En revisión", "Aprobado", "No aplica"];
const productionPlannerStatusOptions = ["Pendiente", "En proceso", "En revisión", "Aprobado", "Programado", "Producido", "Pausado", "Cancelado"];
const productionPlannerNotificationType = "production_assigned";

const workOrderPhaseCatalog = [
  { key: "brief", title: "Brief" },
  { key: "creatividad", title: "Creatividad" },
  { key: "diseno", title: "Diseño" },
  { key: "produccion", title: "Producción" },
  { key: "revision", title: "Revisión" },
  { key: "ajustes", title: "Ajustes" },
  { key: "entrega", title: "Entrega" },
];

const workOrderPhaseStatusLabels = {
  pending: "Sin iniciar",
  in_progress: "En proceso",
  blocked: "En pausa",
  in_review: "Revisión",
  changes_requested: "Ajustes",
  completed: "Terminado",
  cancelled: "Cancelado",
};

const workOrderPhaseEditableStatusLabels = {
  pending: "Sin iniciar",
  in_progress: "En proceso",
  blocked: "En pausa",
  in_review: "Revisión",
  changes_requested: "Ajustes",
  completed: "Terminado",
  cancelled: "Cancelado",
};

function phaseStatusLabel(status) {
  return workOrderPhaseStatusLabels[status] || "Sin iniciar";
}

const defaultWorkOrderPhaseDescriptions = {
  brief: "Contexto, objetivo, prioridades y entregables claros.",
  creatividad: "Concepto, enfoque creativo, copy o estructura.",
  diseno: "Diseño visual, layout, adaptación gráfica o arte base.",
  produccion: "Producción, edición o desarrollo operativo del material.",
  revision: "Validación interna de calidad, enfoque y entregables.",
  ajustes: "Cambios solicitados y afinación final.",
  entrega: "Entrega final, archivo o cierre operativo.",
};

const lumenProcessAreas = {
  diseno: {
    label: "Diseño / Creatividad",
    executionRoles: ["disenador", "creativo", "editor"],
    steps: [
      ["Brief validado", "Cuentas confirma objetivo, target, entregables, fechas y presupuesto."],
      ["Fases y responsables", "Se definen responsables y deadlines por fase dentro de la OT."],
      ["Concepto y diseño", "Creativo/Diseño desarrolla propuesta visual alineada al brief."],
      ["Revisión interna", "Director de Arte o responsable valida calidad antes de cliente."],
      ["Cliente / cambios", "Cuentas presenta, recibe feedback y centraliza ajustes."],
      ["Entrega y cierre", "Se entregan versiones finales y Cuentas cierra oficialmente la OT."],
    ],
  },
  arte_final: {
    label: "Arte final",
    executionRoles: ["disenador", "editor"],
    steps: [
      ["Brief y propuesta aprobada", "La solicitud entra con material o propuesta ya aprobada."],
      ["Fases y responsables", "Se define quién toma cada fase y cuándo debe completarla."],
      ["Adaptaciones", "Arte final prepara formatos, resoluciones y versiones."],
      ["Revisión interna", "Se valida que el material esté listo para medios o cliente."],
      ["Ajustes finales", "Se corrigen observaciones puntuales antes de entrega."],
      ["Entrega y archivo", "Se suben finales a carpeta y se marca cierre."],
    ],
  },
  edicion: {
    label: "Edición / Post",
    executionRoles: ["editor", "generador", "creativo"],
    steps: [
      ["Brief o matriz aprobada", "La edición parte de materiales e instrucciones aprobadas."],
      ["Fases y responsables", "Se asigna responsable y deadline a la fase de edición."],
      ["Primer corte", "Editor procesa materiales y arma versión inicial."],
      ["Revisión interna", "Responsable del proyecto revisa ritmo, copy, música y formatos."],
      ["Cambios", "Se aplica una ronda ordenada de ajustes."],
      ["Entrega final", "Se exportan y suben archivos optimizados."],
    ],
  },
  produccion: {
    label: "Producción",
    executionRoles: ["operaciones", "generador", "editor"],
    steps: [
      ["Solicitud de producción", "Cuentas, Creatividad o Digital registra necesidad y brief."],
      ["Asignación de responsable", "Director/Operaciones asigna responsable, equipo y fecha."],
      ["Diseño de producción", "Se define locación, props, shotlist, equipo y plan."],
      ["Producción de materiales", "Generador/equipo captura los materiales."],
      ["Edición y revisión", "Post produce entregables y responsable valida."],
      ["Entrega al cliente", "Cuentas entrega y cierra formalmente."],
    ],
  },
  pauta: {
    label: "Pauta digital",
    executionRoles: ["pauta", "medios"],
    steps: [
      ["Brief de pauta", "Cuentas entrega objetivos, presupuesto, target, fechas y canales."],
      ["Planeación", "Pauta define canales, audiencias, KPIs y distribución de presupuesto."],
      ["Aprobación", "Cliente aprueba plan antes de implementar."],
      ["Implementación", "Se configura pixel, campañas, ad sets y anuncios."],
      ["Optimización", "Tráfico monitorea y documenta ajustes."],
      ["Reporte final", "Se entrega performance y aprendizajes."],
    ],
  },
  matriz: {
    label: "Matriz / Digital",
    executionRoles: ["generador", "creativo", "community"],
    steps: [
      ["Brief mensual", "Cuentas entrega información del mes y prioridades."],
      ["Estrategia", "Digital/Creatividad define pilares, ángulos y KPIs."],
      ["Desarrollo de matriz", "Generador/Community arma estructura y copys."],
      ["Revisión interna", "Una ronda interna valida calidad y enfoque."],
      ["Calendario", "Se monta calendario para aprobación."],
      ["Aprobación y cierre", "Cliente aprueba y se programa o entrega."],
    ],
  },
};

const productions = [
  {
    id: "prod-01",
    brandId: "jim-gt",
    title: "Grabacion showroom SUV",
    date: "2026-05-06",
    time: "09:00",
    location: "Showroom Continental",
    status: "confirmed",
    deliverables: ["ci-jim-01"],
  },
  {
    id: "prod-02",
    brandId: "danone-gt",
    title: "Batch recetas desayuno",
    date: "2026-05-09",
    time: "08:30",
    location: "Cocina estudio",
    status: "planning",
    deliverables: ["ci-danone-01", "ci-silk-01"],
  },
];

let contentItems = [
  {
    id: "ci-silk-01",
    calendarId: "cal-danone-may",
    brandId: "silk-gt",
    title: "Beneficios de cambiar a Silk",
    platform: "Instagram",
    format: "Carrusel",
    pillar: "Educativo",
    scheduledAt: "2026-05-08T10:00:00",
    status: "client_review",
    owner: "vale",
    stage: "final",
    workOrderId: "OT-SILK-047",
    productionId: "prod-02",
    assetVersionId: "av-silk-02",
    caption:
      "Un cambio pequeno puede sentirse grande cuando tu rutina sabe mejor. Guarda esta guia para tu proximo super.",
    comments: [
      {
        author: "Giuliana",
        visibility: "internal",
        text: "Revisar que el claim nutricional este validado.",
      },
      {
        author: "Cliente Danone",
        visibility: "client",
        text: "Aprobamos linea visual. Ajustar ultima lamina con empaque actualizado.",
      },
    ],
  },
  {
    id: "ci-danone-01",
    calendarId: "cal-danone-may",
    brandId: "danone-gt",
    title: "Desayuno rapido con yogurt",
    platform: "Instagram",
    format: "Reel",
    pillar: "Venta",
    scheduledAt: "2026-05-10T08:00:00",
    status: "internal_review",
    owner: "vale",
    stage: "concept",
    workOrderId: "OT-DANONE-018",
    productionId: "prod-02",
    assetVersionId: "av-danone-01",
    caption:
      "Tres ingredientes, cinco minutos y una rutina con mas energia. Asi empieza un dia Danone.",
    comments: [
      {
        author: "Valeria",
        visibility: "internal",
        text: "Pendiente hook final para versión de Reels.",
      },
    ],
  },
  {
    id: "ci-jim-01",
    calendarId: "cal-continental-may",
    brandId: "jim-gt",
    title: "POV prueba de manejo JIM",
    platform: "TikTok",
    format: "Video",
    pillar: "Entretenimiento",
    scheduledAt: "2026-05-07T18:00:00",
    status: "draft",
    owner: "diego",
    stage: "concept",
    workOrderId: "OT-JIM-012",
    productionId: "prod-01",
    assetVersionId: "av-jim-01",
    caption:
      "Si tu carro pudiera hacer este recorrido, tambien pediria test drive.",
    comments: [],
  },
  {
    id: "ci-lumen-01",
    calendarId: "cal-lumen-may",
    brandId: "lumen-agencia",
    title: "Behind the scenes del equipo",
    platform: "Instagram",
    format: "Post estatico",
    pillar: "Comunidad",
    scheduledAt: "2026-05-03T12:00:00",
    status: "approved",
    owner: "giu",
    stage: "scheduled",
    workOrderId: "OT-LUMEN-021",
    productionId: null,
    assetVersionId: "av-lumen-01",
    caption: "Lo que no se ve tambien construye marcas.",
    comments: [],
  },
];

const initialContentItems = contentItems.map((item) => ({
  ...item,
  comments: [...item.comments],
}));
contentItems = loadStoredCollection("lumen_content_items_v1", initialContentItems);

let assetVersions = [
  {
    id: "av-silk-02",
    brandId: "silk-gt",
    contentItemId: "ci-silk-01",
    title: "Silk carrusel v2",
    format: "PNG",
    status: "ready",
    approved: false,
    canvaDesignId: "canva-silk-beneficios",
    previewTone: "green",
    createdAt: "2026-04-27",
  },
  {
    id: "av-danone-01",
    brandId: "danone-gt",
    contentItemId: "ci-danone-01",
    title: "Reel desayuno cover",
    format: "MP4",
    status: "in_design",
    approved: false,
    canvaDesignId: "canva-danone-desayuno",
    previewTone: "cyan",
    createdAt: "2026-04-28",
  },
  {
    id: "av-jim-01",
    brandId: "jim-gt",
    contentItemId: "ci-jim-01",
    title: "TikTok JIM storyboard",
    format: "MP4",
    status: "draft",
    approved: false,
    canvaDesignId: "canva-jim-pov",
    previewTone: "red",
    createdAt: "2026-04-26",
  },
  {
    id: "av-lumen-01",
    brandId: "lumen-agencia",
    contentItemId: "ci-lumen-01",
    title: "BTS equipo final",
    format: "JPG",
    status: "approved",
    approved: true,
    canvaDesignId: "canva-lumen-bts",
    previewTone: "purple",
    createdAt: "2026-04-25",
  },
];

const canvaDesigns = [
  {
    id: "canva-silk-beneficios",
    brandId: "silk-gt",
    title: "Silk beneficios carrusel",
    editUrl: "https://www.canva.com/design/silk-beneficios",
    previewUrl: "",
    lastSyncedAt: "2026-04-28 10:14",
  },
  {
    id: "canva-danone-desayuno",
    brandId: "danone-gt",
    title: "Danone desayuno reel",
    editUrl: "https://www.canva.com/design/danone-desayuno",
    previewUrl: "",
    lastSyncedAt: "2026-04-28 09:40",
  },
  {
    id: "canva-jim-pov",
    brandId: "jim-gt",
    title: "JIM POV test drive",
    editUrl: "https://www.canva.com/design/jim-pov",
    previewUrl: "",
    lastSyncedAt: "2026-04-27 16:22",
  },
  {
    id: "canva-lumen-bts",
    brandId: "lumen-agencia",
    title: "Lumen BTS equipo",
    editUrl: "https://www.canva.com/design/lumen-bts",
    previewUrl: "",
    lastSyncedAt: "2026-04-25 11:10",
  },
];

const reports = [
  { brandId: "silk-gt", metric: "Alcance", value: 42800, trend: 14 },
  { brandId: "silk-gt", metric: "Engagement", value: 5.8, trend: 1.2 },
  { brandId: "danone-gt", metric: "Alcance", value: 51300, trend: 9 },
  { brandId: "jim-gt", metric: "Views", value: 182000, trend: 22 },
];

const initialProductionPlannerItems = [
  { id: "planner-talleres-2026-07", month: 7, year: 2026, brand: "Talleres", medium: "Meta", deliverables: "", talentRequirement: "Modelo", rawMatrixStatus: "En revisión", rawMatrixDueDate: "2026-07-01", productionDate: "2026-07-14", status: "Pendiente", accountOwner: "Raquel", digitalOwner: "lis", notes: "mismo modelo", archivedAt: null },
  { id: "planner-repuestos-2026-07", month: 7, year: 2026, brand: "Repuestos", medium: "Meta", deliverables: "", talentRequirement: "Modelo", rawMatrixStatus: "En revisión", rawMatrixDueDate: "2026-07-01", productionDate: "2026-07-14", status: "Pendiente", accountOwner: "Raquel", digitalOwner: "lis", notes: "mismo modelo", archivedAt: null },
  { id: "planner-volkswagen-2026-07", month: 7, year: 2026, brand: "Volkswagen", medium: "TikTok", deliverables: "10 videos", talentRequirement: "Modelo", rawMatrixStatus: "", rawMatrixDueDate: "2026-07-10", productionDate: "2026-07-15", status: "Pendiente", accountOwner: "Pelin", digitalOwner: "lis", notes: "", archivedAt: null },
  { id: "planner-volkswagen-camiones-2026-07", month: 7, year: 2026, brand: "Volkswagen Camiones", medium: "TikTok", deliverables: "10 videos", talentRequirement: "Vendedor", rawMatrixStatus: "", rawMatrixDueDate: "2026-07-09", productionDate: "2026-07-16", status: "Pendiente", accountOwner: "Pelin", digitalOwner: "lis", notes: "", archivedAt: null },
  { id: "planner-212-2026-07", month: 7, year: 2026, brand: "212", medium: "TikTok", deliverables: "5 videos", talentRequirement: "No", rawMatrixStatus: "Aprobado", rawMatrixDueDate: "", productionDate: "", status: "Pendiente", accountOwner: "Raquel", digitalOwner: "lis", notes: "material de stock ya tiene rodrigo, Revisar Julio con Raquel", archivedAt: null },
  { id: "planner-jim-2026-07", month: 7, year: 2026, brand: "JIM", medium: "TikTok", deliverables: "10 videos", talentRequirement: "Modelo", rawMatrixStatus: "", rawMatrixDueDate: "2026-07-09", productionDate: "2026-07-21", status: "Pendiente", accountOwner: "Raquel", digitalOwner: "lis", notes: "Axel y lis ven modelo", archivedAt: null },
  { id: "planner-bestune-2026-07", month: 7, year: 2026, brand: "Bestune", medium: "TikTok", deliverables: "10 videos", talentRequirement: "Modelo", rawMatrixStatus: "", rawMatrixDueDate: "2026-07-03", productionDate: "2026-07-22", status: "Pendiente", accountOwner: "Raquel", digitalOwner: "", notes: "", archivedAt: null },
  { id: "planner-leapmotor-2026-07", month: 7, year: 2026, brand: "Leapmotor", medium: "TikTok", deliverables: "10 videos", talentRequirement: "Vendedor", rawMatrixStatus: "", rawMatrixDueDate: "2026-07-03", productionDate: "2026-07-20", status: "Pendiente", accountOwner: "Raquel", digitalOwner: "", notes: "", archivedAt: null },
  { id: "planner-washgo-2026-07", month: 7, year: 2026, brand: "Wash&go", medium: "Meta", deliverables: "4 videos", talentRequirement: "No", rawMatrixStatus: "", rawMatrixDueDate: "", productionDate: "2026-07-16", status: "Pendiente", accountOwner: "Karen", digitalOwner: "Javi", notes: "No se necesita produccion en Julio", archivedAt: null },
  { id: "planner-solarsa-2026-07", month: 7, year: 2026, brand: "Solarsa", medium: "Meta", deliverables: "4 videos", talentRequirement: "No", rawMatrixStatus: "", rawMatrixDueDate: "", productionDate: "2026-07-15", status: "Pendiente", accountOwner: "Karen", digitalOwner: "Javi", notes: "", archivedAt: null },
  { id: "planner-usados-2026-07", month: 7, year: 2026, brand: "Usados", medium: "Meta", deliverables: "Diseño", talentRequirement: "", rawMatrixStatus: "En revisión", rawMatrixDueDate: "", productionDate: "", status: "Pendiente", accountOwner: "Raquel", digitalOwner: "Lis", notes: "", archivedAt: null },
  { id: "planner-rz-2026-07", month: 7, year: 2026, brand: "RZ", medium: "", deliverables: "", talentRequirement: "", rawMatrixStatus: "", rawMatrixDueDate: "", productionDate: "", status: "Pendiente", accountOwner: "Karen", digitalOwner: "", notes: "", archivedAt: null },
  { id: "planner-silk-2026-07", month: 7, year: 2026, brand: "SILK", medium: "Meta", deliverables: "8 videos", talentRequirement: "Modelo", rawMatrixStatus: "", rawMatrixDueDate: "", productionDate: "", status: "Pendiente", accountOwner: "Alejandro", digitalOwner: "Javi/Giuls", notes: "En espera de fecha con Axel y Alejandro", archivedAt: null },
];

let productionPlannerItems = loadStoredCollection("lumen_production_planner_items_v1", initialProductionPlannerItems);

const WORK_ORDER_DRAFT_STORAGE_KEY = "lumen_create_work_order_draft";

const state = {
  currentModule: "dashboard",
  currentBrandId: ALL_BRANDS_ID,
  selectedContentId: "ci-silk-01",
  contentView: "concept",
  brandConfigSection: "identity",
  adminEditingUserId: "",
  creatingBrand: false,
  brandSubmitting: false,
  editingWorkOrderId: "",
  viewingWorkOrderId: "",
  focusedWorkOrderId: "",
  workOrderConversations: {},
  workOrderMentionCandidates: {},
  workOrderCommentMentionDrafts: {},
  workOrderConversationReplyingTo: "",
  workOrderConversationPublishing: false,
  workOrderPhaseCommentPublishingIds: new Set(),
  workOrderPhaseReorderSavingId: "",
  workOrderConversationResolvingId: "",
  mentionInbox: {
    status: "idle",
    items: [],
    error: "",
  },
  mentionInboxOpen: false,
  focusedWorkOrderCommentId: "",
  focusedWorkOrderPhaseId: "",
  focusedWorkOrderPhaseCommentId: "",
  creatingWorkOrder: false,
  workOrderSubmitting: false,
  noPhaseOrderStatusProcessingId: "",
  noPhaseOrderStatusDialog: null,
  workOrderDraftPhases: [],
  workOrderFormDraft: null,
  workOrderUsesPhases: false,
  workOrderPhasesExpanded: false,
  dashboardSearch: "",
  dashboardKpiFilter: "open",
  dashboardBrandOpenId: "",
  dashboardMonth: "",
  dashboardOrderScope: "created",
  dashboardOrderFiltersOpen: false,
  dashboardOrderFilters: {
    brand: "",
    status: "",
    priority: "",
    createdDate: "",
    dueDate: "",
    archive: "active",
  },
  mobileNavOpen: false,
  workOrderMonth: "",
  workOrderView: "priority",
  workOrderGroupLimits: {},
  calendarView: "month",
  showArchivedWorkOrders: false,
  workOrderFilters: {
    search: "",
    assignee: "",
    status: "",
    priority: "",
    due: "",
    quick: "",
  },
  reportMonth: "",
  reportStartDate: "",
  reportEndDate: "",
  productionPlannerMonth: 7,
  productionPlannerYear: 2026,
  productionPlannerEditingId: "",
  productionPlannerShowArchived: false,
  productionPlannerFilters: {
    search: "",
    brand: "",
    medium: "",
    status: "",
    accountOwner: "",
    digitalOwner: "",
    responsible: "",
  },
  notificationBrandId: "",
  initialRouteApplied: false,
  workOrderNavigationRevision: 0,
  passwordResetMode: false,
  toast: "",
  debugEvents: [],
};

const workOrderMentionCandidateRequests = new Map();
let activeWorkOrderPhaseDrag = null;

const statusLabels = {
  draft: "Draft",
  internal_review: "Revisión interna",
  client_review: "Revisión cliente",
  changes_requested: "Cambios solicitados",
  approved: "Aprobado",
  completed: "Completado",
  published: "Publicado",
};

const stageLabels = {
  concept: "Concepto",
  final: "Final",
  scheduled: "Programado",
};

const workOrderStatusLabels = {
  new: "Nueva",
  in_progress: "En proceso",
  in_review: "En revisión interna",
  client_approved: "Aprobada por cliente",
  scheduled: "Programada",
  completed: "Entregada",
  cancelled: "Cancelada",
};

const workOrderEditableStatusLabels = {
  new: "Nueva",
  in_progress: "En proceso",
  in_review: "En revisión interna",
  completed: "Entregada",
  cancelled: "Cancelada",
};

const noPhaseWorkOrderStatusLabels = {
  new: "Sin iniciar",
  in_progress: "En proceso",
  completed: "Terminada",
  cancelled: "Cancelada",
};

const workOrderPriorityLabels = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const workOrderCategoryLabels = {
  matriz: "Matriz",
  campana: "Campana",
  dinamica_digital: "Dinámica digital",
  arte_final: "Arte final",
  propuesta: "Propuesta",
  cotizacion: "Cotización",
  diseno: "Diseño",
  edicion: "Edición",
  copy: "Copy",
  pauta: "Pauta",
  produccion: "Producción",
  desarrollo: "Desarrollo",
  otro: "Otro",
};

const workOrderCategoryOptions = {
  matriz: "Matriz",
  campana: "Campana",
  dinamica_digital: "Dinámica digital",
  arte_final: "Arte final",
  propuesta: "Propuesta",
  cotizacion: "Cotización",
  diseno: "Diseño",
  edicion: "Edición",
  pauta: "Pauta",
  produccion: "Producción",
};

const legacyWorkOrderCategoryLabels = {
  copy: "Copy",
  pauta: "Pauta",
  produccion: "Producción",
  desarrollo: "Desarrollo",
  otro: "Otro",
};

const roleLabels = {
  admin: "Admin",
  directora: "Dirección",
  direccion: "Dirección",
  "dirección": "Dirección",
  jefe: "Jefe",
  jefatura: "Jefatura",
  cuentas: "Cuentas",
  coordinador: "Coordinador",
  coordinacion: "Coordinación",
  "coordinación": "Coordinación",
  medios: "Medios",
  creativo: "Creativo",
  disenador: "Diseñador",
  editor: "Editor",
  generador: "Generador",
  community: "Community",
  pauta: "Pauta",
  operaciones: "Operaciones",
  ejecutivo: "Ejecutivo",
  cliente: "Cliente",
};

const workOrderConversationTypeLabels = {
  comment: "Comentario",
  block: "Bloqueo",
  deadline_change: "Cambio de fecha",
  reassignment: "Reasignación",
  decision: "Decisión",
};

const visibleRoleOptions = [
  { value: "admin", label: "Admin" },
  { value: "directora", label: "Dirección" },
  { value: "cuentas", label: "Cuentas" },
  { value: "coordinador", label: "Coordinador" },
  { value: "coordinacion", label: "Coordinación" },
  { value: "medios", label: "Medios" },
  { value: "creativo", label: "Creativo" },
  { value: "disenador", label: "Diseñador" },
  { value: "editor", label: "Editor" },
  { value: "generador", label: "Generador" },
  { value: "community", label: "Community" },
  { value: "pauta", label: "Pauta" },
  { value: "operaciones", label: "Operaciones" },
  { value: "ejecutivo", label: "Ejecutivo" },
  { value: "cliente", label: "Cliente" },
];

function uniqueRoleOptions(options = visibleRoleOptions) {
  const seen = new Set();
  return options.filter((option) => {
    const key = normalizeRoleKey(option.label || option.value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderVisibleRoleOptions(selectedRole = "") {
  return uniqueRoleOptions()
    .map((option) => `<option value="${escapeHtml(option.value)}" ${selectedRole === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
    .join("");
}

function getSupabaseConfig() {
  const config = window.LUMEN_SUPABASE_CONFIG || {};
  const url = (config.url || "").trim();
  const anonKey = (config.anonKey || "").trim();
  if (!url || !anonKey || url.includes("TU-PROYECTO") || anonKey.includes("TU_SUPABASE")) return null;
  return { url, anonKey };
}

function setupSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config || !window.supabase?.createClient) return false;
  supabaseClient = window.supabase.createClient(config.url, config.anonKey);
  dataState.mode = "supabase";
  return true;
}

function isSupabaseMode() {
  return dataState.mode === "supabase" && supabaseClient;
}

function setCollection(target, rows) {
  target.splice(0, target.length, ...rows);
}

function mapDbBrand(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    shortName: row.name,
    abbreviation: row.abbreviation || "",
    slug: row.slug,
    color: row.color_primary || "#2d2d2d",
    platforms: row.platforms || [],
    services: row.services || [],
    monthlyGoal: row.posts_per_month || 10,
    canvaFolder: row.canva_folder_url || "",
    isActive: row.is_active,
  };
}

function normalizeBrandCodePrefix(value) {
  const cleaned = String(value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "");
  return cleaned || "GEN";
}

function fallbackBrandAbbreviation(brand) {
  if (!brand) return "GEN";
  const explicit = brand.abbreviation || officialBrandAbbreviations[brand.slug] || officialBrandAbbreviations[brand.id];
  if (explicit) return normalizeBrandCodePrefix(explicit).slice(0, 4);

  const initials = String(brand.shortName || brand.name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("");

  return normalizeBrandCodePrefix(initials).slice(0, 3) || "GEN";
}

async function generateWorkOrderCodeForBrand(brandId) {
  if (isSupabaseMode()) {
    const { data, error } = await supabaseClient.rpc("generate_work_order_code_for_brand", {
      target_brand_id: brandId,
    });
    if (error) throw error;
    return data;
  }

  const brand = getBrand(brandId);
  const prefix = fallbackBrandAbbreviation(brand);
  const counterKey = `lumen_work_order_counter_${brandId}`;
  const nextNumber = Number(localStorage.getItem(counterKey) || "0") + 1;
  localStorage.setItem(counterKey, String(nextNumber));
  return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
}

function mapDbUser(row, memberships = []) {
  const userMemberships = memberships.filter((membership) => membership.user_id === row.id);
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    isActive: row.is_active !== false,
    brands: userMemberships.map((membership) => membership.brand_id),
    memberships: userMemberships,
  };
}

function mapDbWorkOrder(row) {
  const assignees = (row.assignees || []).map((assignee) => assignee.user_id);
  const files = (row.files || []).map((file) => ({
    id: file.id,
    name: file.file_name,
    size: file.file_size,
    type: file.file_type,
    storagePath: file.storage_path,
    uploadedBy: file.uploaded_by,
  }));
  return {
    id: row.code,
    dbId: row.id,
    brandId: row.brand_id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    category: row.category,
    dueDate: row.due_date,
    assignee: assignees[0] || null,
    assignees,
    description: row.description || "",
    files,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at || null,
    artCount: row.art_count ?? null,
    isUrgent: Boolean(row.is_urgent),
    notifyOnEmail: row.notify_on_email,
    phases: phaseReorder.sortedPhases((row.phases || []).map(mapDbWorkOrderPhase)),
    linkedContentId: null,
  };
}

function mapDbWorkOrderPhase(row) {
  return {
    id: row.id || `phase-${Date.now()}`,
    dbId: row.id || null,
    workOrderId: row.work_order_id || "",
    phaseKey: row.phase_key || "custom",
    title: row.title || workOrderPhaseTitle(row.phase_key || "custom"),
    description: row.description || "",
    assignedTo: row.assigned_to || "",
    status: row.status || "pending",
    dueDate: row.due_date || "",
    completedAt: row.completed_at || "",
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
    comments: Array.isArray(row.comments) ? row.comments : [],
  };
}

function mapDbWorkOrderPhaseComment(row) {
  return {
    id: row.id,
    workOrderId: row.work_order_id,
    phaseId: row.phase_id,
    authorId: row.author_id,
    body: row.body || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function mapDbWorkOrderComment(row) {
  return {
    id: row.comment_id || row.id,
    workOrderId: row.work_order_id,
    authorId: row.author_user_id,
    parentCommentId: row.parent_comment_id || "",
    message: row.message || "",
    commentType: row.comment_type || "comment",
    requiresResponse: Boolean(row.requires_response),
    resolutionStatus: row.resolution_status || "open",
    resolvedBy: row.resolved_by || "",
    resolvedAt: row.resolved_at || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
    mentions: (row.mentions || []).map((mention) => ({
      id: mention.id,
      userId: mention.mentioned_user_id,
      mentionedByUserId: mention.mentioned_by_user_id,
      eventKey: mention.event_key || "",
      readAt: mention.read_at || "",
      createdAt: mention.created_at || "",
      name: mention.mentioned_profile?.full_name || "",
    })),
  };
}

function mapDbProductionPlannerItem(row) {
  return {
    id: row.id,
    month: Number(row.month || 7),
    year: Number(row.year || 2026),
    brand: row.brand || "",
    medium: row.medium || "",
    deliverables: row.deliverables || "",
    talentRequirement: row.talent_requirement || "",
    rawMatrixStatus: row.raw_matrix_status || "",
    rawMatrixDueDate: row.raw_matrix_due_date || "",
    productionDate: row.production_date || "",
    status: row.status || "Pendiente",
    accountOwner: row.account_owner || "",
    digitalOwner: row.digital_owner || "",
    additionalResponsibleIds: Array.isArray(row.additional_responsible_ids) ? row.additional_responsible_ids : [],
    notes: row.notes || "",
    createdBy: row.created_by || "",
    updatedBy: row.updated_by || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
    archivedAt: row.archived_at || null,
  };
}

function mapDbEmailNotification(row) {
  return {
    id: row.id,
    notificationType: row.notification_type || "",
    status: row.status || "queued",
    subject: row.subject || "",
    recipientEmail: row.recipient_email || "",
    scheduledFor: row.scheduled_for || "",
    sentAt: row.sent_at || "",
    errorMessage: row.error_message || "",
    createdAt: row.created_at || "",
  };
}

function mapDbWeeklyDigestRun(row) {
  return {
    id: row.id,
    runDate: row.run_date || "",
    subject: row.subject || "",
    recipientsCount: Number(row.recipients_count || 0),
    openOrdersCount: Number(row.open_orders_count || 0),
    overdueOrdersCount: Number(row.overdue_orders_count || 0),
    status: row.status || "draft",
    createdAt: row.created_at || "",
    sentAt: row.sent_at || "",
  };
}

function mapDbNotificationRule(row) {
  return {
    id: row.rule_key || "",
    title: row.title || row.rule_key || "Regla sin nombre",
    channel: row.channel || "Sin canal",
    recipients: row.recipients || "Sin destinatarios configurados",
    enabled: row.is_enabled === true,
    source: "database",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function productionPlannerItemToDb(item) {
  return {
    month: Number(item.month || state.productionPlannerMonth || 7),
    year: Number(item.year || state.productionPlannerYear || 2026),
    brand: item.brand || "",
    medium: item.medium || null,
    deliverables: item.deliverables || null,
    talent_requirement: item.talentRequirement || null,
    raw_matrix_status: item.rawMatrixStatus || null,
    raw_matrix_due_date: item.rawMatrixDueDate || null,
    production_date: item.productionDate || null,
    status: item.status || "Pendiente",
    account_owner: item.accountOwner || null,
    digital_owner: item.digitalOwner || null,
    additional_responsible_ids: uniqueUserIds(item.additionalResponsibleIds || []),
    notes: item.notes || null,
  };
}

function loadActiveBrandRows() {
  return supabaseClient.from("brands").select("*").eq("is_active", true).order("name");
}

async function loadSupabaseData() {
  if (!isSupabaseMode() || !dataState.session) return;

  dataState.clientsReady = false;
  dataState.brandsReady = false;

  const [
    profileResult,
    clientsResult,
    brandsResult,
    membershipsResult,
    profilesResult,
    ordersResult,
    notificationRecipientsResult,
    phasesResult,
    phaseCommentsResult,
    productionPlannerResult,
    emailNotificationsResult,
    weeklyDigestRunsResult,
    notificationRulesResult,
  ] = await Promise.all([
    supabaseClient.from("profiles").select("*").eq("id", dataState.session.user.id).maybeSingle(),
    supabaseClient.from("clients").select("*").order("name"),
    loadActiveBrandRows(),
    supabaseClient.from("brand_memberships").select("*"),
    supabaseClient.from("profiles").select("*").order("full_name"),
    supabaseClient
      .from("work_orders")
      .select(
        `
          *,
          assignees:work_order_assignees(user_id),
          files:work_order_files(id,file_name,file_type,file_size,storage_path,uploaded_by)
        `,
      )
      .order("due_date", { ascending: true }),
    supabaseClient.from("brand_notification_recipients").select("brand_id,user_id"),
    supabaseClient
      .from("work_order_phases")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true }),
    supabaseClient.from("work_order_phase_comments").select("*").order("created_at", { ascending: true }),
    supabaseClient.from("production_planner_items").select("*").order("production_date", { ascending: true }),
    supabaseClient
      .from("email_notifications")
      .select("id,notification_type,status,subject,recipient_email,scheduled_for,sent_at,error_message,created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabaseClient
      .from("weekly_digest_runs")
      .select("id,run_date,subject,recipients_count,open_orders_count,overdue_orders_count,status,created_at,sent_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseClient
      .from("notification_rules")
      .select("id,rule_key,title,channel,recipients,is_enabled,created_at,updated_at")
      .order("created_at", { ascending: true }),
  ]);

  const error =
    profileResult.error ||
    clientsResult.error ||
    brandsResult.error ||
    membershipsResult.error ||
    profilesResult.error ||
    ordersResult.error;

  if (error) throw error;

  dataState.profile = profileResult.data;
  setCollection(
    clients,
    (clientsResult.data || []).map((client) => ({
      id: client.id,
      name: client.name,
      slug: client.slug,
    })),
  );
  setCollection(brands, (brandsResult.data || []).map(mapDbBrand));
  dataState.clientsReady = true;
  dataState.brandsReady = true;
  setCollection(users, (profilesResult.data || []).map((profile) => mapDbUser(profile, membershipsResult.data || [])));
  dataState.brandNotificationRecipientsReady = !notificationRecipientsResult.error;
  dataState.productionPlannerReady = !productionPlannerResult.error;
  dataState.emailNotificationsReady = !emailNotificationsResult.error;
  dataState.weeklyDigestRunsReady = !weeklyDigestRunsResult.error;
  dataState.notificationRulesReady = !notificationRulesResult.error;
  dataState.workOrderPhasesReady = !phasesResult.error;
  dataState.phaseCommentsReady = !phaseCommentsResult.error;
  if (phasesResult.error) {
    debugInteraction("work-order-phases:load:error", {
      message: phasesResult.error.message || "",
      details: phasesResult.error.details || "",
    });
  }
  if (phaseCommentsResult.error) {
    debugInteraction("phase-comments:load:error", {
      message: phaseCommentsResult.error.message || "",
      details: phaseCommentsResult.error.details || "",
    });
  }
  setCollection(
    brandNotificationRecipients,
    (notificationRecipientsResult.data || []).map((recipient) => ({
      brandId: recipient.brand_id,
      userId: recipient.user_id,
    })),
  );
  const phasesByOrderId = new Map();
  const commentsByPhaseId = new Map();
  dataState.phaseComments = [];
  if (!phaseCommentsResult.error) {
    dataState.phaseComments = (phaseCommentsResult.data || []).map(mapDbWorkOrderPhaseComment);
    debugInteraction("phase-comments:loaded", {
      count: dataState.phaseComments.length,
      sample: dataState.phaseComments.slice(0, 3),
    });
    (phaseCommentsResult.data || []).forEach((comment) => {
      const list = commentsByPhaseId.get(comment.phase_id) || [];
      list.push(mapDbWorkOrderPhaseComment(comment));
      commentsByPhaseId.set(comment.phase_id, list);
    });
  }
  if (!phasesResult.error) {
    (phasesResult.data || []).forEach((phase) => {
      const list = phasesByOrderId.get(phase.work_order_id) || [];
      list.push({
        ...phase,
        comments: commentsByPhaseId.get(phase.id) || [],
      });
      phasesByOrderId.set(phase.work_order_id, list);
    });
  }
  workOrders = (ordersResult.data || []).map((row) =>
    mapDbWorkOrder({
      ...row,
      phases: phasesByOrderId.get(row.id) || [],
    }),
  );
  if (!productionPlannerResult.error) {
    productionPlannerItems = (productionPlannerResult.data || []).map(mapDbProductionPlannerItem);
  }
  if (!emailNotificationsResult.error) {
    setCollection(emailNotifications, (emailNotificationsResult.data || []).map(mapDbEmailNotification));
  }
  if (!weeklyDigestRunsResult.error) {
    setCollection(weeklyDigestRuns, (weeklyDigestRunsResult.data || []).map(mapDbWeeklyDigestRun));
  }
  if (!notificationRulesResult.error) {
    setCollection(notificationRules, (notificationRulesResult.data || []).map(mapDbNotificationRule));
  }

  if (!isAllBrandsScope() && !brands.some((brand) => brand.id === state.currentBrandId)) {
    state.currentBrandId = ALL_BRANDS_ID;
  }
}

function captureNavigationState() {
  return {
    currentModule: state.currentModule,
    currentBrandId: state.currentBrandId,
    selectedContentId: state.selectedContentId,
    editingWorkOrderId: state.editingWorkOrderId,
    viewingWorkOrderId: state.viewingWorkOrderId,
    focusedWorkOrderId: state.focusedWorkOrderId,
    creatingWorkOrder: state.creatingWorkOrder,
    workOrderSubmitting: state.workOrderSubmitting,
    workOrderUsesPhases: state.workOrderUsesPhases,
    workOrderPhasesExpanded: state.workOrderPhasesExpanded,
    workOrderDraftPhases: state.workOrderDraftPhases,
    workOrderFormDraft: state.workOrderFormDraft,
    productionPlannerEditingId: state.productionPlannerEditingId,
  };
}

function restoreNavigationState(snapshot) {
  if (!snapshot) return;
  state.currentModule = snapshot.currentModule;
  if (brands.some((brand) => brand.id === snapshot.currentBrandId) || snapshot.currentBrandId === ALL_BRANDS_ID) {
    state.currentBrandId = snapshot.currentBrandId;
  }
  state.selectedContentId = snapshot.selectedContentId;
  state.editingWorkOrderId = snapshot.editingWorkOrderId;
  state.viewingWorkOrderId = snapshot.viewingWorkOrderId;
  state.focusedWorkOrderId = snapshot.focusedWorkOrderId;
  state.creatingWorkOrder = snapshot.creatingWorkOrder;
  state.workOrderSubmitting = snapshot.workOrderSubmitting;
  state.workOrderUsesPhases = snapshot.workOrderUsesPhases;
  state.workOrderPhasesExpanded = Boolean(snapshot.workOrderPhasesExpanded);
  state.workOrderDraftPhases = snapshot.workOrderDraftPhases || [];
  state.workOrderFormDraft = snapshot.workOrderFormDraft;
  state.productionPlannerEditingId = snapshot.productionPlannerEditingId;
}

async function refreshSupabaseData({ silent = true, preserveNavigation = true } = {}) {
  const navigationSnapshot = preserveNavigation ? captureNavigationState() : null;
  const navigationRevision = state.workOrderNavigationRevision;
  if (state.creatingWorkOrder) syncOpenWorkOrderDraftBeforeSuspend();
  if (!silent) {
    dataState.loading = true;
    render();
  }
  try {
    await loadSupabaseData();
    if (preserveNavigation && navigationRevision === state.workOrderNavigationRevision) {
      restoreNavigationState(navigationSnapshot);
    } else if (preserveNavigation) {
      applyWorkOrderRouteFromLocation({ normalize: true, showInvalidMessage: false });
    }
    dataState.initialized = true;
  } finally {
    if (!silent) dataState.loading = false;
  }
}

async function initializeApp() {
  const hasSupabase = setupSupabaseClient();
  if (!hasSupabase) {
    dataState.mode = "demo";
    dataState.loading = false;
    applyInitialRouteParams();
    render();
    return;
  }

  dataState.loading = true;
  render();

  try {
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();
    if (error) throw error;
    dataState.session = session;
    if (session) {
      await loadSupabaseData();
      applyInitialRouteParams();
      dataState.initialized = true;
    }
  } catch (error) {
    dataState.error = error.message || "No se pudo conectar Supabase";
  } finally {
    dataState.loading = false;
    render();
  }

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    const previousUserId = dataState.session?.user?.id || "";
    dataState.session = session;
    dataState.error = "";
    if (previousUserId && previousUserId !== (session?.user?.id || "")) {
      state.workOrderConversations = {};
      state.workOrderMentionCandidates = {};
      state.workOrderCommentMentionDrafts = {};
      state.mentionInbox = { status: "idle", items: [], error: "" };
      state.mentionInboxOpen = false;
    }
    if (_event === "PASSWORD_RECOVERY") {
      dataState.passwordResetMode = true;
    }
    if (_event === "TOKEN_REFRESHED" || (_event === "INITIAL_SESSION" && dataState.initialized)) {
      render();
      return;
    }
    if (session) {
      const silent = dataState.initialized;
      const wasInitialized = dataState.initialized;
      try {
        await refreshSupabaseData({ silent, preserveNavigation: true });
        if (!wasInitialized) applyInitialRouteParams();
      } catch (error) {
        dataState.error = error.message || "No se pudo cargar Supabase";
      } finally {
        dataState.loading = false;
      }
    } else {
      dataState.initialized = false;
    }
    render();
  });
}

function getBrand(id = state.currentBrandId) {
  return brands.find((brand) => brand.id === id) || brands[0];
}

function getClient(id) {
  return clients.find((client) => client.id === id);
}

function activeBrandCollection() {
  return brands.filter((brand) => brand.isActive !== false);
}

function brandCollectionGroups() {
  const activeBrands = activeBrandCollection();
  const visibleClientIds = new Set(clients.map((client) => client.id));
  const groups = clients
    .map((client) => ({
      id: client.id,
      label: client.name,
      client,
      brands: activeBrands.filter((brand) => brand.clientId === client.id),
    }))
    .filter((group) => group.brands.length);
  const brandsWithoutVisibleClient = activeBrands.filter(
    (brand) => !brand.clientId || !visibleClientIds.has(brand.clientId),
  );

  if (brandsWithoutVisibleClient.length) {
    groups.push({
      id: "available-brands",
      label: "Marcas disponibles",
      client: null,
      brands: brandsWithoutVisibleClient,
    });
  }

  return groups;
}

function visibleModules() {
  return OPERATIONS_MODE ? modules.filter((module) => operationalModuleKeys.includes(module.key)) : modules;
}

function renderSidebarNav() {
  if (!OPERATIONS_MODE) {
    return visibleModules()
      .map(
        (module) => `
          <button class="nav-button ${module.key === state.currentModule ? "active" : ""}" data-module="${module.key}">
            <span class="nav-icon">${iconSvg(module.key)}</span>
            <span>${moduleDisplayLabel(module)}</span>
          </button>
        `,
      )
      .join("");
  }

  return operationalNavGroups
    .map((group) => {
      const groupModules = group.keys.filter(canOpenModule).map((key) => getModuleMeta(key)).filter(Boolean);
      if (!groupModules.length) return "";
      return `
        <div class="nav-group">
          <div class="nav-group-label">${group.label}</div>
          ${groupModules
            .map(
              (module) => `
                <button class="nav-button ${module.key === state.currentModule ? "active" : ""}" data-module="${module.key}">
                  <span class="nav-icon">${iconSvg(module.key)}</span>
                  <span>${moduleDisplayLabel(module)}</span>
                </button>
              `,
            )
            .join("")}
        </div>
      `;
    })
    .join("");
}

function getModuleMeta(key = state.currentModule) {
  return modules.find((module) => module.key === key) || modules[0];
}

function moduleDisplayLabel(module) {
  if (module?.key === "work-orders" && isOperationalUserRole()) return "Mis órdenes";
  return module?.label || "";
}

function canOpenModule(key) {
  if (!ENABLE_AI_ASSISTANT && aiModuleKeys.includes(key)) return false;
  if (key === "notifications") return canAccessNotificationModule();
  if (key === "production-planner") return canAccessProductionPlanner();
  if (!OPERATIONS_MODE) return true;
  if (!operationalModuleKeys.includes(key)) return false;
  if (!isManagementDashboardRole()) return operationalUserModuleKeys.includes(key);
  return true;
}

function isAllBrandsScope(brandId = state.currentBrandId) {
  return brandId === ALL_BRANDS_ID;
}

function getScopeTitle() {
  if (isAllBrandsScope()) return "Resumen general";
  return getBrand().name;
}

function getScopeSubtitle() {
  if (isAllBrandsScope()) return "Vista global / todas las marcas activas";
  const brand = getBrand();
  const client = getClient(brand.clientId);
  return client ? `${client.name} / ${brand.name}` : brand.name;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function plainText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function parseListLines(value = "") {
  return String(value)
    .split("\n")
    .map((line) => line.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean);
}

function splitWorkOrderDescription(value = "") {
  const marker = "\n\n---\nSeguimiento operativo";
  const raw = String(value || "");
  const markerIndex = raw.indexOf(marker);
  if (markerIndex === -1) {
    return { description: raw.trim(), subtasks: [], materialChanges: [] };
  }

  const description = raw.slice(0, markerIndex).trim();
  const extras = raw.slice(markerIndex + marker.length).trim();
  const subtasksMatch = extras.match(/Subtareas:\n([\s\S]*?)(?:\n\nCambios en materiales:|$)/);
  const materialMatch = extras.match(/Cambios en materiales:\n([\s\S]*)/);

  return {
    description,
    subtasks: parseListLines(subtasksMatch?.[1] || ""),
    materialChanges: parseListLines(materialMatch?.[1] || ""),
  };
}

function composeWorkOrderDescription(description, subtasks, materialChanges) {
  const base = String(description || "").trim();
  const taskLines = parseListLines(Array.isArray(subtasks) ? subtasks.join("\n") : subtasks);
  const materialLines = parseListLines(Array.isArray(materialChanges) ? materialChanges.join("\n") : materialChanges);
  const blocks = [];

  if (taskLines.length) {
    blocks.push(`Subtareas:\n${taskLines.map((item) => `- ${item}`).join("\n")}`);
  }
  if (materialLines.length) {
    blocks.push(`Cambios en materiales:\n${materialLines.map((item) => `- ${item}`).join("\n")}`);
  }

  if (!blocks.length) return base;
  return `${base}\n\n---\nSeguimiento operativo\n\n${blocks.join("\n\n")}`.trim();
}

function getAppBaseUrl() {
  const configuredUrl = (window.LUMEN_SUPABASE_CONFIG?.appUrl || "").trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  if (url.pathname.endsWith("/index.html")) {
    url.pathname = url.pathname.replace(/index\.html$/, "");
  }
  return url.href.replace(/\/$/, "");
}

function buildWorkOrderUrl(orderCode, brandId, commentId = "") {
  const url = new URL(getAppBaseUrl());
  url.searchParams.set("module", "work-orders");
  url.searchParams.set("brand", brandId);
  url.searchParams.set("ot", orderCode);
  if (commentId) url.searchParams.set("comment", commentId);
  return url.toString();
}

const workOrderRouteParamNames = ["ot", "work_order_id", "order_id"];
const workOrderCommentRouteParamNames = ["comment", "comment_id", "highlight"];
const workOrderPhaseRouteParamNames = ["phase", "phase_id"];
const workOrderPhaseCommentRouteParamNames = ["phase_comment", "phase_comment_id"];

function firstRouteParam(params, names) {
  return names.map((name) => params.get(name)).find(Boolean) || "";
}

function clearWorkOrderConversationNavigationState() {
  state.workOrderConversationReplyingTo = "";
  state.workOrderCommentMentionDrafts = {};
  state.workOrderConversationResolvingId = "";
  state.focusedWorkOrderCommentId = "";
  state.focusedWorkOrderPhaseId = "";
  state.focusedWorkOrderPhaseCommentId = "";
  state.noPhaseOrderStatusDialog = null;
}

function workOrderNavigationUrl(
  order = null,
  commentId = "",
  { phaseId = "", phaseCommentId = "" } = {},
) {
  const url = new URL(window.location.href);
  [
    ...workOrderRouteParamNames,
    ...workOrderCommentRouteParamNames,
    ...workOrderPhaseRouteParamNames,
    ...workOrderPhaseCommentRouteParamNames,
  ].forEach((name) => url.searchParams.delete(name));
  if (order) {
    url.searchParams.set("module", "work-orders");
    url.searchParams.set("brand", order.brandId);
    url.searchParams.set("ot", order.id);
    if (commentId) url.searchParams.set("comment", commentId);
    if (phaseId) url.searchParams.set("phase", phaseId);
    if (phaseCommentId) url.searchParams.set("phase_comment", phaseCommentId);
  }
  return url;
}

function setActiveWorkOrderNavigation(
  order = null,
  { commentId = "", phaseId = "", phaseCommentId = "", historyMode = "push" } = {},
) {
  const previousOrderId = state.viewingWorkOrderId || state.focusedWorkOrderId || "";
  const nextOrderId = order?.id || "";
  if (
    previousOrderId !== nextOrderId
    || commentId !== state.focusedWorkOrderCommentId
    || phaseCommentId !== state.focusedWorkOrderPhaseCommentId
  ) {
    clearWorkOrderConversationNavigationState();
  }

  state.workOrderNavigationRevision += 1;
  state.currentModule = "work-orders";
  state.viewingWorkOrderId = nextOrderId;
  state.focusedWorkOrderId = nextOrderId;
  state.focusedWorkOrderCommentId = commentId;
  state.focusedWorkOrderPhaseId = phaseId;
  state.focusedWorkOrderPhaseCommentId = phaseCommentId;
  if (order?.brandId) state.currentBrandId = order.brandId;

  const url = workOrderNavigationUrl(order, commentId, { phaseId, phaseCommentId });
  const method = historyMode === "replace" ? "replaceState" : "pushState";
  window.history[method]({ workOrderId: nextOrderId || null }, "", url);
}

function applyWorkOrderRouteFromLocation({ normalize = true, showInvalidMessage = true } = {}) {
  const params = new URLSearchParams(window.location.search);
  const orderParam = firstRouteParam(params, workOrderRouteParamNames);
  const commentParam = firstRouteParam(params, workOrderCommentRouteParamNames);
  const phaseParam = firstRouteParam(params, workOrderPhaseRouteParamNames);
  const phaseCommentParam = firstRouteParam(params, workOrderPhaseCommentRouteParamNames);

  if (!orderParam) {
    clearWorkOrderConversationNavigationState();
    state.viewingWorkOrderId = "";
    state.focusedWorkOrderId = "";
    if (
      normalize
      && [...workOrderCommentRouteParamNames, ...workOrderPhaseRouteParamNames, ...workOrderPhaseCommentRouteParamNames]
        .some((name) => params.has(name))
    ) {
      window.history.replaceState({ workOrderId: null }, "", workOrderNavigationUrl());
    }
    return null;
  }

  const order = findWorkOrderByAnyId(orderParam);
  if (!order || !canOpenWorkOrder(order)) {
    clearWorkOrderConversationNavigationState();
    state.currentModule = "work-orders";
    state.viewingWorkOrderId = "";
    state.focusedWorkOrderId = "";
    window.history.replaceState({ workOrderId: null }, "", workOrderNavigationUrl());
    if (showInvalidMessage) {
      showToast(order ? "No tienes acceso a esta orden." : "No se encontró la orden solicitada.");
    }
    return null;
  }

  clearWorkOrderConversationNavigationState();
  state.currentModule = "work-orders";
  state.currentBrandId = order.brandId;
  state.viewingWorkOrderId = order.id;
  state.focusedWorkOrderId = order.id;
  state.focusedWorkOrderCommentId = commentParam;
  state.focusedWorkOrderPhaseId = phaseParam;
  state.focusedWorkOrderPhaseCommentId = phaseCommentParam;
  markWorkOrderMentionCandidatesStale(order);

  if (normalize) {
    const canonicalUrl = workOrderNavigationUrl(order, commentParam, {
      phaseId: phaseParam,
      phaseCommentId: phaseCommentParam,
    });
    if (canonicalUrl.href !== window.location.href) {
      window.history.replaceState({ workOrderId: order.id }, "", canonicalUrl);
    }
  }
  return order;
}

function handleWorkOrderNavigationPopState() {
  state.workOrderNavigationRevision += 1;
  state.editingWorkOrderId = "";
  state.creatingWorkOrder = false;
  applyWorkOrderRouteFromLocation({ normalize: true, showInvalidMessage: true });
  render();
}

function clearConsumedWorkOrderCommentRoute() {
  const url = new URL(window.location.href);
  let changed = false;
  [
    ...workOrderCommentRouteParamNames,
    ...workOrderPhaseRouteParamNames,
    ...workOrderPhaseCommentRouteParamNames,
  ].forEach((name) => {
    if (url.searchParams.has(name)) {
      url.searchParams.delete(name);
      changed = true;
    }
  });
  if (changed) window.history.replaceState(window.history.state, "", url);
}

function applyInitialRouteParams() {
  if (state.initialRouteApplied) return;
  const params = new URLSearchParams(window.location.search);
  const moduleParam = params.get("module");
  const brandParam = params.get("brand");

  if (moduleParam && canOpenModule(moduleParam)) {
    state.currentModule = moduleParam;
  }
  if (brandParam && (brandParam === ALL_BRANDS_ID || brands.some((brand) => brand.id === brandParam))) {
    state.currentBrandId = brandParam;
  }
  applyWorkOrderRouteFromLocation({ normalize: true, showInvalidMessage: true });

  state.initialRouteApplied = true;
}

function focusLinkedWorkOrder() {
  if (state.currentModule !== "work-orders" || !state.focusedWorkOrderId) return;
  window.setTimeout(() => {
    const card = Array.from(document.querySelectorAll("[data-order-card]")).find(
      (candidate) => candidate.dataset.orderCard === state.focusedWorkOrderId,
    );
    card?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
  }, 150);
}

function renderBrandOptions(activeBrandId = state.currentBrandId) {
  return `
    <option value="${ALL_BRANDS_ID}" ${activeBrandId === ALL_BRANDS_ID ? "selected" : ""}>
      Resumen general
    </option>
    ${brandCollectionGroups()
      .map(
        (group) => `
        <optgroup label="${escapeHtml(group.label)}">
          ${group.brands
            .map(
              (brandItem) => `
                <option value="${brandItem.id}" ${brandItem.id === activeBrandId ? "selected" : ""}>
                  ${escapeHtml(brandItem.shortName)}
                </option>
              `,
            )
            .join("")}
        </optgroup>
      `,
      )
      .join("")}
  `;
}

function renderLumenLogo(className = "") {
  return `<img class="lumen-logo-img ${className}" src="./assets/lumen-logo.png" alt="Lumen Workspace" />`;
}

function createDefaultBrandConfig(brand) {
  return {
    identity: {
      positioning: `${brand.name} debe comunicar con claridad, consistencia y foco comercial.`,
      personality: "Cercana, confiable y directa.",
      promise: `Contenido util y accionable para ${brand.shortName}.`,
      brandRisks: "Evitar claims no validados y promesas absolutas.",
    },
    channels: {
      channelObjective: brand.platforms.map((platform) => `${platform}: objetivo pendiente`).join("\n"),
      cadence: `${brand.monthlyGoal} piezas mensuales`,
      primaryKpis: brand.platforms.includes("TikTok") ? "Views, shares, leads" : "Alcance, engagement, clicks",
      externalLinks: "",
    },
    services: {
      activeServices: brand.services.join(", "),
      deliverables: `${brand.monthlyGoal} piezas de contenido por mes.`,
      communityRules: brand.services.includes("Comunidad") ? "Responder dudas frecuentes y escalar leads sensibles." : "No aplica.",
      reportingRules: brand.services.includes("Reporteria") ? "Reporte mensual por marca." : "Sin reportería activa.",
    },
    audiences: {
      primaryAudience: "Pendiente de completar con el equipo.",
      painPoints: "",
      motivators: "",
      objections: "",
    },
    voice: {
      tone: "Claro, util, cercano y orientado a accion.",
      approvedPhrases: "",
      bannedPhrases: "claims no validados, exceso de hashtags",
      examples: "",
      geminiModel: "gemini-1.5-pro",
      systemPrompt: `Usa el contexto de ${brand.name}, respeta tono, restricciones y objetivos por canal.`,
    },
    assets: {
      canvaFolder: brand.canvaFolder,
      templates: "",
      visualRules: "Usar identidad visual aprobada y mantener consistencia por formato.",
      referenceLinks: "",
    },
    governance: {
      approvers: getClient(brand.clientId)?.name || "Equipo Lumen",
      sla: "24-48h para revisión de piezas.",
      legalNotes: "",
      escalation: "Escalar claims sensibles, quejas delicadas o cambios de estrategia.",
    },
  };
}

function loadBrandConfigStore() {
  try {
    return JSON.parse(localStorage.getItem("lumen_brand_config_v1") || "{}");
  } catch {
    return {};
  }
}

function saveBrandConfigStore(store) {
  localStorage.setItem("lumen_brand_config_v1", JSON.stringify(store));
}

function loadStoredCollection(key, fallback) {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

function saveContentItems() {
  localStorage.setItem("lumen_content_items_v1", JSON.stringify(contentItems));
}

function saveWorkOrders() {
  if (isSupabaseMode()) return;
  localStorage.setItem("lumen_work_orders_v1", JSON.stringify(workOrders));
}

function saveUsers() {
  if (isSupabaseMode()) return;
  localStorage.setItem("lumen_users_v1", JSON.stringify(users));
}

function getBrandConfig(brandId = state.currentBrandId) {
  const store = loadBrandConfigStore();
  if (!store[brandId]) {
    store[brandId] = createDefaultBrandConfig(getBrand(brandId));
    saveBrandConfigStore(store);
  }
  return store[brandId];
}

function updateBrandConfigValue(sectionKey, fieldKey, value) {
  const store = loadBrandConfigStore();
  store[state.currentBrandId] = store[state.currentBrandId] || createDefaultBrandConfig(getBrand());
  store[state.currentBrandId][sectionKey] = store[state.currentBrandId][sectionKey] || {};
  store[state.currentBrandId][sectionKey][fieldKey] = value;
  saveBrandConfigStore(store);
}

function sectionCompletion(config, section) {
  const values = section.fields.map(([fieldKey]) => (config[section.key]?.[fieldKey] || "").trim());
  const filled = values.filter(Boolean).length;
  return Math.round((filled / values.length) * 100);
}

function overallConfigCompletion(config) {
  const scores = brandConfigSections.map((section) => sectionCompletion(config, section));
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function brandItems(brandId = state.currentBrandId) {
  if (isAllBrandsScope(brandId)) return contentItems;
  return contentItems.filter((item) => item.brandId === brandId);
}

function visibleContentItems(brandId = state.currentBrandId) {
  return brandItems(brandId).filter((item) => {
    if (state.contentView === "scheduled") return item.stage === "scheduled" || item.status === "approved";
    return item.stage === state.contentView;
  });
}

function brandOrders(brandId = state.currentBrandId, options = {}) {
  const scopedOrders = isAllBrandsScope(brandId)
    ? workOrders
    : workOrders.filter((order) => order.brandId === brandId);
  const includeArchived = options.includeArchived ?? false;
  return includeArchived ? scopedOrders : scopedOrders.filter((order) => !isArchivedWorkOrder(order));
}

function orderAssignees(order) {
  if (Array.isArray(order.assignees) && order.assignees.length) return order.assignees;
  return order.assignee ? [order.assignee] : [];
}

function orderFiles(order) {
  return Array.isArray(order.files) ? order.files : [];
}

function internalUsers() {
  return users.filter((user) => user.role !== "cliente" && user.isActive !== false);
}

function activeUsers() {
  return users.filter((user) => user.isActive !== false);
}

function brandEmailRecipientIds(brandId) {
  if (!brandId) return [];
  return brandNotificationRecipients
    .filter((recipient) => recipient.brandId === brandId)
    .map((recipient) => recipient.userId);
}

function configuredBrandEmailRecipientUsers(brandId) {
  const recipientIds = brandEmailRecipientIds(brandId);
  return internalUsers().filter((user) => recipientIds.includes(user.id) && user.email);
}

function uniqueUserIds(userIds = []) {
  return Array.from(new Set((userIds || []).filter(Boolean)));
}

function brandEmailRecipientUsers(brandId, fallbackUserIds = [], options = {}) {
  const configuredRecipients = options.includeConfigured ? configuredBrandEmailRecipientUsers(brandId) : [];
  const fallbackRecipients = internalUsers().filter((user) => fallbackUserIds.includes(user.id) && user.email);
  const recipients = new Map();
  [...configuredRecipients, ...fallbackRecipients].forEach((user) => recipients.set(user.id, user));
  return [...recipients.values()];
}

function dedupeUsersByEmail(recipientUsers = []) {
  const recipients = new Map();
  recipientUsers.forEach((user) => {
    const email = String(user.email || "").trim().toLowerCase();
    if (email && !recipients.has(email)) recipients.set(email, user);
  });
  return [...recipients.values()];
}

function normalizedRecipientEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isValidRecipientEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedRecipientEmail(value));
}

function brandEmailRecipientSummary(brandId, fallbackUserIds = []) {
  const configuredRecipients = configuredBrandEmailRecipientUsers(brandId);
  const fallbackRecipients = brandEmailRecipientUsers(brandId, fallbackUserIds);
  if (fallbackRecipients.length) return `Sin lista fija: se enviara a responsables seleccionados o asignados a fases.`;
  if (configuredRecipients.length) {
    return `La lista fija de marca se usa solo para alertas o automatizaciones configuradas; esta OT avisara a responsables seleccionados.`;
  }
  return "Sin lista fija: si no eliges responsables ni asignas fases, no se preparara email.";
}

function isSystemAdmin() {
  return ["admin", "directora"].includes(dataState.profile?.role);
}

function canManageWorkOrders() {
  if (!isSupabaseMode()) return true;
  return workOrderManagerRoles.includes(dataState.profile?.role);
}

function normalizeRoleKey(role = "") {
  return String(role)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function canonicalRoleKey(role = "") {
  const normalizedRole = normalizeRoleKey(role);
  if (normalizedRole === "administrador") return "admin";
  if (["director", "direccion"].includes(normalizedRole)) return "directora";
  if (normalizedRole === "cuenta") return "cuentas";
  return normalizedRole;
}

function canCreateBrands(role = dataState.profile?.role) {
  if (!isSupabaseMode() && !role) return true;
  return new Set(["admin", "directora", "cuentas", "ejecutivo"]).has(canonicalRoleKey(role));
}

function canAccessNotificationModule(role = dataState.profile?.role) {
  if (!isSupabaseMode() && !role) return true;
  const normalizedRole = normalizeRoleKey(role);
  const accessRole = ["direccion", "director"].includes(normalizedRole) ? "directora" : normalizedRole;
  return notificationModuleRoles.has(accessRole);
}

function canManageUrgency() {
  if (!isSupabaseMode()) return true;
  const role = normalizeRoleKey(dataState.profile?.role);
  return urgencyManagerRoles.map(normalizeRoleKey).includes(role);
}

function canAccessProductionPlanner() {
  if (!isSupabaseMode()) return true;
  const role = normalizeRoleKey(dataState.profile?.role || "");
  const email = String(dataState.profile?.email || "").trim().toLowerCase();
  const allowedRoles = productionPlannerRoles.map(normalizeRoleKey);
  return allowedRoles.some((allowedRole) => role.includes(allowedRole)) || productionPlannerEmails.includes(email);
}

function isManagementDashboardRole(role = dataState.profile?.role) {
  if (!isSupabaseMode() && !role) return true;
  return workOrderManagerRoles.includes(role);
}

function usesCreatedOrdersDashboard(role = dataState.profile?.role) {
  if (!isSupabaseMode() && !role) return true;
  return createdOrdersDashboardRoles.has(normalizeRoleKey(role));
}

function isOperationalUserRole(role = dataState.profile?.role) {
  return !isManagementDashboardRole(role) && role !== "cliente";
}

function canCreateWorkOrders() {
  if (!isSupabaseMode()) return true;
  return workOrderCreatorRoles.includes(dataState.profile?.role);
}

function canArchiveWorkOrders() {
  if (!isSupabaseMode()) return true;
  return canManageWorkOrders() || canCreateWorkOrders();
}

function canUploadWorkOrderMaterials(order = null) {
  if (!isSupabaseMode()) return true;
  const role = dataState.profile?.role;
  if (!workOrderMaterialRoles.includes(role)) return false;
  if (["admin", "directora"].includes(role)) return true;
  const currentUser = users.find((user) => user.id === dataState.session?.user?.id);
  return order ? canUserAccessBrand(currentUser, order.brandId) : true;
}

function canDeleteWorkOrderFile(order, file) {
  if (!isSupabaseMode()) return true;
  if (!order || !file) return false;
  if (canManageWorkOrders()) return true;
  const currentUserId = dataState.session?.user?.id;
  return Boolean(currentUserId && file.uploadedBy === currentUserId && canUploadWorkOrderMaterials(order));
}

function canRunOperationalEmail() {
  if (!isSupabaseMode()) return true;
  return canManageWorkOrders() || canCreateWorkOrders() || workOrderMaterialRoles.includes(dataState.profile?.role);
}

function hasGlobalBrandAccess(user) {
  return ["admin", "directora"].includes(user?.role);
}

function canUserAccessBrand(user, brandId) {
  return hasGlobalBrandAccess(user) || (user?.brands || []).includes(brandId);
}

function userName(userId) {
  return users.find((user) => user.id === userId)?.name || "Sin asignar";
}

function phaseAssigneeLabel(userId) {
  if (!userId) return "Sin responsable asignado";
  const user = users.find((candidate) => candidate.id === userId);
  if (user) return user.name;
  return `Responsable asignado (${String(userId).slice(0, 8)})`;
}

function userEmail(userId) {
  return users.find((user) => user.id === userId)?.email || "";
}

function userBrandLabel(user) {
  if (hasGlobalBrandAccess(user)) return "Todas las marcas";
  const userBrands = user.brands || [];
  if (!userBrands.length) return "Sin marcas asignadas";
  return userBrands
    .slice(0, 3)
    .map((id) => getBrand(id)?.shortName || "Marca")
    .join(", ")
    .concat(userBrands.length > 3 ? ` +${userBrands.length - 3}` : "");
}

function todayAtNoon() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return today;
}

const dateOnlyMonthLabels = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function dateOnlyParts(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > lastDayOfMonth) return null;
  return { year, month, day };
}

function formatDateOnly(value) {
  const parts = dateOnlyParts(value);
  if (!parts) return "";
  return `${parts.day} ${dateOnlyMonthLabels[parts.month - 1]} ${parts.year}`;
}

function parseDateValue(value, fallbackTime = "T12:00:00") {
  if (!value) return null;
  const text = String(value).trim();
  const dateOnly = dateOnlyParts(text);
  if (dateOnly) {
    const timeMatch = /^T(\d{2})(?::(\d{2}))?(?::(\d{2}))?/.exec(String(fallbackTime || ""));
    const date = new Date(
      dateOnly.year,
      dateOnly.month - 1,
      dateOnly.day,
      Number(timeMatch?.[1] || 12),
      Number(timeMatch?.[2] || 0),
      Number(timeMatch?.[3] || 0),
      0,
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(dateValue) {
  const date = parseDateValue(dateValue);
  if (!date) return 999;
  return Math.ceil((date - todayAtNoon()) / 86400000);
}

function monthKeyFromDate(date = todayAtNoon()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function isoDateFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function todayDateOnly() {
  return isoDateFromDate(todayAtNoon());
}

function isPastDateOnly(value) {
  return Boolean(dateOnlyParts(value) && value < todayDateOnly());
}

function monthCalendarDays(monthKey) {
  const [yearText, monthText] = String(monthKey || monthKeyFromDate()).split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const first = new Date(year, monthIndex, 1, 12, 0, 0, 0);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      iso: isoDateFromDate(date),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === monthIndex,
      isToday: isoDateFromDate(date) === isoDateFromDate(todayAtNoon()),
    };
  });
}

function dateMatchesMonth(dateValue, monthKey) {
  return Boolean(dateValue && monthKey && String(dateValue).slice(0, 7) === monthKey);
}

function inDateRange(dateValue, startDate, endDate) {
  const date = parseDateValue(dateValue);
  if (!date) return false;
  const start = startDate ? parseDateValue(startDate, "T00:00:00") : null;
  const end = endDate ? parseDateValue(endDate, "T23:59:59") : null;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function wasCompletedLate(order) {
  if (!["completed", "client_approved", "scheduled"].includes(order.status)) return false;
  const dueEnd = parseDateValue(order.dueDate, "T23:59:59");
  if (!dueEnd) return false;
  const completedAt = parseDateValue(order.completedAt || order.updatedAt) || todayAtNoon();
  return completedAt > dueEnd;
}

function workOrderUrgency(order) {
  if (isArchivedWorkOrder(order)) return { label: "Archivada", cls: "neutral" };
  if (order.status === "scheduled") return { label: "Programada", cls: "green" };
  if (order.status === "client_approved") return { label: "Aprobada por cliente", cls: "green" };
  if (order.status === "completed") return { label: "Entregada", cls: "blue" };
  if (order.status === "cancelled") return { label: "Cancelada", cls: "neutral" };
  const dueDate = workOrderEffectiveDueDate(order);
  if (isUrgentWorkOrder(order) && !dueDate) return { label: "Urgente", cls: "red" };
  if (!dueDate) return { label: "Sin fecha", cls: "neutral" };
  const days = daysUntil(dueDate);
  if (isUrgentWorkOrder(order) && days >= 0) return { label: days <= 1 ? "Urgente · inmediato" : "Urgente", cls: "red" };
  if (days < 0) return { label: `Vencida hace ${Math.abs(days)}d`, cls: "red" };
  if (days === 0) return { label: "Vence hoy", cls: "red" };
  if (days === 1) return { label: "Vence mañana", cls: "amber" };
  return { label: `${days}d restantes`, cls: "blue" };
}

function shouldRenderWorkOrderTimingBadge(order) {
  return !isArchivedWorkOrder(order) && isOpenWorkOrder(order);
}

function isUrgentWorkOrder(order) {
  return Boolean(order?.isUrgent);
}

function workOrderEffectiveDueDate(order) {
  if (order?.dueDate) return order.dueDate;
  return workOrderPhases(order)
    .filter((phase) => isActivePhase(phase) && phase.dueDate)
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate))[0]?.dueDate || "";
}

function nextWorkOrderStatus(order) {
  const next = {
    new: "in_progress",
    in_progress: "in_review",
    in_review: "completed",
  };
  return next[order.status] || null;
}

function isArchivedWorkOrder(order) {
  return Boolean(order.archivedAt);
}

function isOpenWorkOrder(order) {
  return !isArchivedWorkOrder(order) && !["completed", "client_approved", "scheduled", "cancelled"].includes(order.status);
}

function isDeliveredWorkOrder(order) {
  return !isArchivedWorkOrder(order) && ["completed", "client_approved", "scheduled"].includes(order.status);
}

function teamWorkload(userId, sourceOrders = workOrders) {
  const assigned = sourceOrders.filter((order) => orderAssignees(order).includes(userId));
  const open = assigned.filter(isOpenWorkOrder);
  const overdue = open.filter((order) => daysUntil(order.dueDate) < 0);
  const review = open.filter((order) => order.status === "in_review");
  return { assigned, open, overdue, review };
}

function workOrderProcessArea(category = "diseno") {
  const aliases = {
    campana: "diseno",
    dinamica_digital: "matriz",
    copy: "matriz",
    propuesta: "diseno",
    cotizacion: "pauta",
    otro: "diseno",
  };
  return lumenProcessAreas[category] || lumenProcessAreas[aliases[category]] || lumenProcessAreas.diseno;
}

function workOrderPhaseTitle(phaseKey = "custom") {
  return workOrderPhaseCatalog.find((phase) => phase.key === phaseKey)?.title || "Fase personalizada";
}

function workOrderPhases(order) {
  return phaseReorder.sortedPhases(order?.phases || []);
}

function normalizedPhaseFromValues(phase, index) {
  const phaseKey = phase.phaseKey || "custom";
  const status = phase.status || "pending";
  const completedAt = status === "completed" ? phase.completedAt || new Date().toISOString() : null;
  return {
    id: phase.id || `draft-phase-${Date.now()}-${index}`,
    dbId: phase.dbId || null,
    phaseKey,
    title: phase.title || workOrderPhaseTitle(phaseKey),
    description: phase.description || "",
    assignedTo: phase.assignedTo || "",
    status,
    dueDate: phase.dueDate || "",
    completedAt,
    sortOrder: Number.isFinite(Number(phase.sortOrder)) ? Number(phase.sortOrder) : index,
  };
}

function normalizeWorkOrderPhases(phases = []) {
  return phaseReorder.sortedPhases(phases.map(normalizedPhaseFromValues));
}

function phaseStatusClass(status = "pending") {
  if (status === "completed") return "done";
  if (["in_progress", "in_review"].includes(status)) return "active";
  if (["blocked", "changes_requested"].includes(status)) return "blocked";
  if (status === "cancelled") return "cancelled";
  return "";
}

function currentProfileId() {
  return dataState.profile?.id || dataState.session?.user?.id || "";
}

function debugInteraction(eventName, details = {}) {
  if (!DEBUG_INTERACTIONS) return;
  const event = {
    at: new Date().toISOString(),
    event: eventName,
    role: dataState.profile?.role || "sin-perfil",
    module: state.currentModule,
    currentView: state.currentModule,
    selectedWorkOrderId: state.viewingWorkOrderId || state.focusedWorkOrderId || "",
    profileId: currentProfileId(),
    ...details,
  };
  state.debugEvents = [event, ...(state.debugEvents || [])].slice(0, 12);
  console.debug(`[Lumen interaction] ${eventName}`, event);
  updateDebugInteractionsPanel();
}

function debugSafeJson(value) {
  try {
    return JSON.stringify(value, (_key, innerValue) => {
      if (innerValue instanceof Error) return innerValue.message;
      if (typeof innerValue === "function") return "[Function]";
      return innerValue;
    });
  } catch {
    return String(value || "");
  }
}

function renderDebugInteractionsPanel() {
  if (!DEBUG_INTERACTIONS) return "";
  const lastEvent = state.debugEvents?.[0] || {};
  return `
    <aside
      id="debug-interactions-panel"
      style="position:fixed;right:12px;bottom:12px;z-index:9999;width:min(460px,calc(100vw - 24px));max-height:52vh;overflow:auto;background:#101815;color:#e9f5ef;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:12px;box-shadow:0 16px 50px rgba(0,0,0,.25);font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;"
    >
      ${renderDebugInteractionsPanelContent(lastEvent)}
    </aside>
  `;
}

function renderDebugInteractionsPanelContent(lastEvent = state.debugEvents?.[0] || {}) {
  if (!DEBUG_INTERACTIONS) return "";
  const rows = (state.debugEvents || []).slice(0, 8);
  return `
    <div style="font-weight:700;margin-bottom:6px;">Debug interactions activo</div>
    <div>build: <strong>${escapeHtml(APP_BUILD_MARKER)}</strong></div>
    <div>currentUserId: ${escapeHtml(currentProfileId() || "sin usuario")}</div>
    <div>currentView: ${escapeHtml(state.currentModule || "")}</div>
    <div>selectedWorkOrderId: ${escapeHtml(state.viewingWorkOrderId || state.focusedWorkOrderId || "")}</div>
    <div>lastAction: ${escapeHtml(lastEvent.event || "")}</div>
    <div>lastRpc: ${escapeHtml(String(lastEvent.rpc || lastEvent.action || ""))}</div>
    <div>lastRpcPayload: ${escapeHtml(debugSafeJson(lastEvent.payload || lastEvent.rpcPayload || {}))}</div>
    <div>lastRpcResult: ${escapeHtml(debugSafeJson(lastEvent.result || lastEvent.data || lastEvent.returnedStatus || lastEvent.commentId || ""))}</div>
    <div>lastRpcError: ${escapeHtml(debugSafeJson(lastEvent.error || ""))}</div>
    <hr style="border:0;border-top:1px solid rgba(255,255,255,.16);margin:8px 0;" />
    ${rows
      .map(
        (event) => `
          <div style="margin-bottom:8px;">
            <strong>${escapeHtml(event.event)}</strong>
            <span style="opacity:.72;">${escapeHtml(new Date(event.at).toLocaleTimeString("es-MX"))}</span>
            <pre style="white-space:pre-wrap;margin:2px 0 0;color:#cfe5db;">${escapeHtml(debugSafeJson(event))}</pre>
          </div>
        `,
      )
      .join("")}
  `;
}

function updateDebugInteractionsPanel() {
  if (!DEBUG_INTERACTIONS || typeof document === "undefined") return;
  const panel = document.getElementById("debug-interactions-panel");
  if (!panel) return;
  panel.innerHTML = renderDebugInteractionsPanelContent();
}

function isCurrentUserRelatedToWorkOrder(order) {
  if (!order) return false;
  const currentId = currentProfileId();
  if (!currentId) return false;
  return (
    order.createdBy === currentId ||
    orderAssignees(order).includes(currentId) ||
    workOrderPhases(order).some((phase) => phase.assignedTo === currentId || phase.assigned_to === currentId)
  );
}

function canOpenWorkOrder(order) {
  if (!order) return false;
  if (!isSupabaseMode()) return true;
  if (!isOperationalUserRole()) return true;
  return isCurrentUserRelatedToWorkOrder(order);
}

function canCompleteWorkOrderPhase(phase, order = null) {
  if (!phase || phase.status === "completed" || phase.status === "cancelled") return false;
  if (order && isArchivedWorkOrder(order)) return false;
  if (canManageWorkOrders()) return true;
  const currentId = currentProfileId();
  return Boolean(currentId && (phase.assignedTo === currentId || phase.assigned_to === currentId));
}

function hasConfirmedNoWorkOrderPhases(order) {
  return Boolean(
    order
    && isSupabaseMode()
    && dataState.workOrderPhasesReady
    && workOrderPhases(order).length === 0
  );
}

function canChangeWorkOrderWithoutPhasesStatus(order) {
  if (!order) return false;
  if (!hasConfirmedNoWorkOrderPhases(order)) return false;
  if (isArchivedWorkOrder(order)) return false;

  const currentId = currentProfileId();
  if (!currentId || !internalUsers().some((user) => user.id === currentId)) return false;
  if (!canOpenWorkOrder(order)) return false;

  return (
    canManageWorkOrders()
    || order.createdBy === currentId
    || orderAssignees(order).includes(currentId)
  );
}

function noPhaseStatusTransitionAllowed(order, nextStatus) {
  if (!order || !canChangeWorkOrderWithoutPhasesStatus(order)) return false;
  if (!Object.prototype.hasOwnProperty.call(noPhaseWorkOrderStatusLabels, nextStatus)) return false;
  if (order.status === nextStatus) return false;
  if (["completed", "cancelled"].includes(order.status)) {
    return canManageWorkOrders() && nextStatus === "in_progress";
  }
  if (order.status === "new") return ["in_progress", "completed", "cancelled"].includes(nextStatus);
  if (order.status === "in_progress") return ["new", "completed", "cancelled"].includes(nextStatus);
  if (order.status === "in_review") return ["in_progress", "completed", "cancelled"].includes(nextStatus);
  return false;
}

function canUpdateWorkOrderPhaseStatus(phase, order = null) {
  if (!phase || phase.status === "cancelled") return false;
  if (order && isArchivedWorkOrder(order)) return false;
  if (canManageWorkOrders()) return true;
  const currentId = currentProfileId();
  return Boolean(currentId && (phase.assignedTo === currentId || phase.assigned_to === currentId));
}

function canModifyWorkOrderPhaseStructure(order) {
  if (!order || isArchivedWorkOrder(order)) return false;
  if (!isSupabaseMode()) return true;
  if (canManageWorkOrders()) return true;
  const currentId = currentProfileId();
  return Boolean(currentId && canCreateWorkOrders() && order.createdBy === currentId);
}

function canReorderWorkOrderPhases(order) {
  return Boolean(
    canModifyWorkOrderPhaseStructure(order)
    && workOrderPhases(order).length > 1
    && !state.workOrderPhaseReorderSavingId,
  );
}

function canCommentOnWorkOrderPhase(phase, order = null) {
  return canUpdateWorkOrderPhaseStatus(phase, order);
}

function renderPhaseStatusControl(phase, order) {
  if (!canUpdateWorkOrderPhaseStatus(phase, order)) return "";
  debugInteraction("phase-status:control-rendered", {
    phaseId: phase.id,
    status: phase.status,
    action: "set-phase-status",
    optionCount: Object.keys(workOrderPhaseEditableStatusLabels).length,
  });
  return `
    <div class="phase-status-control">
      <span>Estado</span>
      <div class="stage-control phase-status-buttons">
        ${Object.entries(workOrderPhaseEditableStatusLabels)
          .map(
            ([value, label]) => `
              <button
                type="button"
                class="${phase.status === value ? "active" : ""}"
                data-action="set-phase-status"
                data-phase-id="${escapeHtml(phase.id)}"
                data-next-status="${escapeHtml(value)}"
                ${phase.status === value ? "disabled" : ""}
              >
                ${escapeHtml(label)}
              </button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function safeLinkHref(url = "") {
  const raw = String(url || "");
  const href = raw.startsWith("www.") ? `https://${raw}` : raw;
  try {
    const parsed = new URL(href);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.href;
  } catch {
    return "";
  }
}

function renderLinkedText(value = "") {
  const text = String(value || "");
  const urlPattern = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
  let cursor = 0;
  let html = "";
  for (const match of text.matchAll(urlPattern)) {
    const url = match[0];
    const index = match.index || 0;
    html += escapeHtml(text.slice(cursor, index));
    const href = safeLinkHref(url);
    html += href
      ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`
      : escapeHtml(url);
    cursor = index + url.length;
  }
  html += escapeHtml(text.slice(cursor));
  return html.replace(/\n/g, "<br />");
}

function workOrderConversationKey(order) {
  return order?.dbId || order?.id || "";
}

function workOrderConversationState(order) {
  const key = workOrderConversationKey(order);
  return state.workOrderConversations[key] || {
    status: isSupabaseMode() ? "idle" : "loaded",
    comments: [],
    error: "",
  };
}

function setWorkOrderConversationState(order, nextState) {
  const key = workOrderConversationKey(order);
  if (!key) return;
  state.workOrderConversations[key] = {
    ...workOrderConversationState(order),
    ...nextState,
  };
}

function workOrderMentionCandidateState(order) {
  const key = workOrderConversationKey(order);
  return state.workOrderMentionCandidates[key] || {
    status: "idle",
    items: [],
    error: "",
    fetchedAt: "",
    needsRefresh: false,
    refreshing: false,
  };
}

function setWorkOrderMentionCandidateState(order, nextState) {
  const key = workOrderConversationKey(order);
  if (!key) return;
  state.workOrderMentionCandidates[key] = {
    ...workOrderMentionCandidateState(order),
    ...nextState,
  };
}

function markWorkOrderMentionCandidatesStale(order) {
  if (!workOrderConversationKey(order)) return;
  setWorkOrderMentionCandidateState(order, { needsRefresh: true });
}

function workOrderMentionDraftKey(order, parentCommentId = "") {
  return `${workOrderConversationKey(order)}::${parentCommentId || "root"}`;
}

function workOrderMentionDraft(order, parentCommentId = "") {
  const key = workOrderMentionDraftKey(order, parentCommentId);
  return state.workOrderCommentMentionDrafts[key] || {
    mentions: [],
    query: "",
    tokenStart: -1,
    activeIndex: 0,
    open: false,
  };
}

function setWorkOrderMentionDraft(order, parentCommentId, nextState) {
  const key = workOrderMentionDraftKey(order, parentCommentId);
  state.workOrderCommentMentionDrafts[key] = {
    ...workOrderMentionDraft(order, parentCommentId),
    ...nextState,
  };
}

function clearWorkOrderMentionDraft(order, parentCommentId = "") {
  delete state.workOrderCommentMentionDrafts[workOrderMentionDraftKey(order, parentCommentId)];
}

function reconcileWorkOrderMentionDraft(order, parentCommentId, value) {
  const draft = workOrderMentionDraft(order, parentCommentId);
  const mentions = draft.mentions
    .filter((mention) => String(value).includes(mention.token))
    .map((mention) => {
      const start = String(value).indexOf(mention.token);
      return { ...mention, start, end: start + mention.token.length };
    });
  setWorkOrderMentionDraft(order, parentCommentId, { mentions });
  return mentions;
}

function mentionQueryAtCursor(value, cursorPosition) {
  const prefix = String(value).slice(0, cursorPosition);
  const match = prefix.match(/(?:^|\s)@([^@\n]*)$/);
  if (!match) return null;
  const tokenStart = prefix.lastIndexOf("@");
  return {
    query: match[1].trimStart(),
    tokenStart,
  };
}

function filteredWorkOrderMentionCandidates(order, parentCommentId = "", query = "") {
  const normalizedQuery = normalizeSearchText(query);
  const selectedIds = new Set(
    workOrderMentionDraft(order, parentCommentId).mentions.map((mention) => mention.userId),
  );
  return workOrderMentionCandidateState(order).items.filter((candidate) => {
    if (selectedIds.has(candidate.id)) return false;
    if (!normalizedQuery) return true;
    return normalizeSearchText(`${candidate.name} ${candidate.email} ${candidate.role}`).includes(normalizedQuery);
  });
}

function updateWorkOrderMentionDropdown(textarea) {
  const order = selectedViewingOrder();
  if (!order || !textarea) return;
  const parentCommentId = textarea.dataset.parentCommentId || "";
  const cursorPosition = textarea.selectionStart || 0;
  const draftKey = textarea.dataset.mentionDraftKey || workOrderMentionDraftKey(order, parentCommentId);
  const dropdown = document.querySelector(`[data-mention-dropdown="${CSS.escape(draftKey)}"]`);
  const currentMentions = reconcileWorkOrderMentionDraft(order, parentCommentId, textarea.value);
  let mentionAtCursor = mentionQueryAtCursor(textarea.value, cursorPosition);
  if (
    mentionAtCursor
    && currentMentions.some(
      (mention) => mention.start === mentionAtCursor.tokenStart && cursorPosition >= mention.end,
    )
  ) {
    mentionAtCursor = null;
  }
  renderWorkOrderMentionDraftSummaryIntoDom(order, parentCommentId);
  if (!dropdown) return;

  if (!mentionAtCursor) {
    setWorkOrderMentionDraft(order, parentCommentId, { open: false, query: "", tokenStart: -1 });
    dropdown.hidden = true;
    dropdown.replaceChildren();
    return;
  }

  const draft = workOrderMentionDraft(order, parentCommentId);
  const candidates = filteredWorkOrderMentionCandidates(order, parentCommentId, mentionAtCursor.query).slice(0, 8);
  const activeIndex = Math.min(draft.activeIndex || 0, Math.max(candidates.length - 1, 0));
  setWorkOrderMentionDraft(order, parentCommentId, {
    open: true,
    query: mentionAtCursor.query,
    tokenStart: mentionAtCursor.tokenStart,
    activeIndex,
  });

  dropdown.replaceChildren();
  if (!candidates.length) {
    const empty = document.createElement("div");
    empty.className = "work-order-mention-dropdown-empty";
    empty.textContent = workOrderMentionCandidateState(order).error
      ? "No se pudo actualizar la lista de personas."
      : "No hay personas autorizadas que coincidan.";
    dropdown.append(empty);
  } else {
    candidates.forEach((candidate, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `work-order-mention-option ${index === activeIndex ? "is-active" : ""}`;
      button.dataset.action = "select-work-order-mention";
      button.dataset.id = candidate.id;
      button.dataset.mentionDraftKey = draftKey;
      button.dataset.parentCommentId = parentCommentId;
      const name = document.createElement("strong");
      name.textContent = candidate.name;
      const detail = document.createElement("span");
      detail.textContent = [candidate.email, roleLabels[candidate.role] || candidate.role].filter(Boolean).join(" · ");
      button.append(name, detail);
      dropdown.append(button);
    });
  }
  dropdown.hidden = false;
}

function handleWorkOrderMentionInput(event) {
  const textarea = event.target.closest?.("[data-mention-draft-key]");
  if (!textarea) return;
  updateWorkOrderMentionDropdown(textarea);
}

function handleNoPhaseStatusDialogKeydown(event) {
  if (!state.noPhaseOrderStatusDialog) return false;
  const dialog = document.querySelector(".no-phase-status-modal");
  if (!dialog) return false;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeNoPhaseOrderStatusDialog();
    return true;
  }
  if (event.key !== "Tab") return false;
  const focusable = Array.from(
    dialog.querySelectorAll('button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'),
  ).filter((element) => element.getAttribute("aria-hidden") !== "true");
  if (!focusable.length) return false;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
    return true;
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
    return true;
  }
  return false;
}

function handleWorkOrderMentionKeydown(event) {
  if (handleNoPhaseStatusDialogKeydown(event)) return;
  const textarea = event.target.closest?.("[data-mention-draft-key]");
  if (!textarea) return;
  const order = selectedViewingOrder();
  if (!order) return;
  const parentCommentId = textarea.dataset.parentCommentId || "";
  const draft = workOrderMentionDraft(order, parentCommentId);
  if (!draft.open) return;
  const candidates = filteredWorkOrderMentionCandidates(order, parentCommentId, draft.query).slice(0, 8);

  if (event.key === "Escape") {
    event.preventDefault();
    setWorkOrderMentionDraft(order, parentCommentId, { open: false });
    const dropdown = document.querySelector(`[data-mention-dropdown="${CSS.escape(textarea.dataset.mentionDraftKey)}"]`);
    if (dropdown) dropdown.hidden = true;
    return;
  }
  if (!["ArrowDown", "ArrowUp", "Enter"].includes(event.key) || !candidates.length) return;
  event.preventDefault();
  if (event.key === "Enter") {
    selectWorkOrderMention(candidates[draft.activeIndex || 0]?.id, {
      dataset: {
        mentionDraftKey: textarea.dataset.mentionDraftKey,
        parentCommentId,
      },
    });
    return;
  }
  const direction = event.key === "ArrowDown" ? 1 : -1;
  const activeIndex = (draft.activeIndex + direction + candidates.length) % candidates.length;
  setWorkOrderMentionDraft(order, parentCommentId, { activeIndex });
  updateWorkOrderMentionDropdown(textarea);
}

function selectWorkOrderMention(userId, actionElement) {
  const order = selectedViewingOrder();
  if (!order || !userId) return;
  const parentCommentId = actionElement?.dataset?.parentCommentId || "";
  const draft = workOrderMentionDraft(order, parentCommentId);
  const candidate = workOrderMentionCandidateState(order).items.find((item) => item.id === userId);
  const textarea = document.querySelector(
    `[data-mention-draft-key="${CSS.escape(actionElement?.dataset?.mentionDraftKey || workOrderMentionDraftKey(order, parentCommentId))}"]`,
  );
  if (!candidate || !textarea || draft.tokenStart < 0) return;

  const token = `@${candidate.name}`;
  const cursor = textarea.selectionStart || textarea.value.length;
  textarea.value = `${textarea.value.slice(0, draft.tokenStart)}${token} ${textarea.value.slice(cursor)}`;
  const nextCursor = draft.tokenStart + token.length + 1;
  textarea.focus();
  textarea.setSelectionRange(nextCursor, nextCursor);
  const mentions = [
    ...draft.mentions.filter((mention) => mention.userId !== candidate.id),
    { userId: candidate.id, name: candidate.name, token, start: draft.tokenStart, end: draft.tokenStart + token.length },
  ];
  setWorkOrderMentionDraft(order, parentCommentId, {
    mentions,
    open: false,
    query: "",
    tokenStart: -1,
    activeIndex: 0,
  });
  renderWorkOrderMentionDraftSummaryIntoDom(order, parentCommentId);
  const dropdown = document.querySelector(`[data-mention-dropdown="${CSS.escape(textarea.dataset.mentionDraftKey)}"]`);
  if (dropdown) {
    dropdown.hidden = true;
    dropdown.replaceChildren();
  }
}

function renderWorkOrderMentionDraftSummaryIntoDom(order, parentCommentId = "") {
  const draftKey = workOrderMentionDraftKey(order, parentCommentId);
  const dropdown = document.querySelector(`[data-mention-dropdown="${CSS.escape(draftKey)}"]`);
  if (!dropdown) return;
  const previous = dropdown.previousElementSibling;
  if (previous?.classList.contains("work-order-mention-selection")) previous.remove();
  const draft = workOrderMentionDraft(order, parentCommentId);
  if (!draft.mentions.length) return;
  const selection = document.createElement("div");
  selection.className = "work-order-mention-selection";
  selection.setAttribute("aria-label", "Personas mencionadas");
  draft.mentions.forEach((mention) => {
    const chip = document.createElement("span");
    chip.className = "work-order-mention-chip";
    chip.append(document.createTextNode(`@${mention.name} `));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.action = "remove-work-order-mention";
    remove.dataset.id = mention.userId;
    remove.dataset.mentionDraftKey = draftKey;
    remove.setAttribute("aria-label", `Quitar mención de ${mention.name}`);
    remove.textContent = "×";
    chip.append(remove);
    selection.append(chip);
  });
  dropdown.before(selection);
}

function removeWorkOrderMention(userId, actionElement) {
  const order = selectedViewingOrder();
  if (!order) return;
  const draftKey = actionElement?.dataset?.mentionDraftKey || "";
  const parentCommentId = draftKey.split("::").slice(1).join("::") === "root"
    ? ""
    : draftKey.split("::").slice(1).join("::");
  const draft = workOrderMentionDraft(order, parentCommentId);
  const mention = draft.mentions.find((item) => item.userId === userId);
  const textarea = document.querySelector(`[data-mention-draft-key="${CSS.escape(draftKey)}"]`);
  if (mention && textarea) {
    const tokenStart = textarea.value.slice(mention.start, mention.end) === mention.token
      ? mention.start
      : textarea.value.indexOf(mention.token);
    if (tokenStart >= 0) {
      textarea.value = `${textarea.value.slice(0, tokenStart)}${textarea.value.slice(tokenStart + mention.token.length)}`
        .replace(/ {2,}/g, " ");
    }
  }
  setWorkOrderMentionDraft(order, parentCommentId, {
    mentions: draft.mentions.filter((item) => item.userId !== userId),
  });
  renderWorkOrderMentionDraftSummaryIntoDom(order, parentCommentId);
  textarea?.focus();
}

function canParticipateInWorkOrderConversation(order) {
  if (!order || isArchivedWorkOrder(order)) return false;
  if (!isSupabaseMode()) return true;
  if (normalizeRoleKey(dataState.profile?.role) === "cliente") return false;

  const currentId = currentProfileId();
  if (!currentId) return false;
  if (isCurrentUserRelatedToWorkOrder(order)) return true;

  const currentUser = users.find((user) => user.id === currentId);
  return Boolean(canManageWorkOrders() && currentUser && canUserAccessBrand(currentUser, order.brandId));
}

function canResolveWorkOrderConversationTopic(order, comment) {
  if (!canParticipateInWorkOrderConversation(order)) return false;
  if (!comment || comment.parentCommentId || comment.resolutionStatus !== "open") return false;
  const currentId = currentProfileId();
  return Boolean(
    currentId &&
      (comment.authorId === currentId || order.createdBy === currentId || canManageWorkOrders()),
  );
}

function shouldRenderConversationForOrder(order) {
  const selected = selectedViewingOrder();
  return Boolean(selected && order && workOrderConversationKey(selected) === workOrderConversationKey(order));
}

async function refreshWorkOrderMentionCandidates(order, { force = false } = {}) {
  if (!isSupabaseMode() || !order?.dbId || !canParticipateInWorkOrderConversation(order)) return [];

  const key = workOrderConversationKey(order);
  const cachedState = workOrderMentionCandidateState(order);
  if (!force && cachedState.status === "loaded" && !cachedState.needsRefresh) {
    return cachedState.items;
  }

  const pendingRequest = workOrderMentionCandidateRequests.get(key);
  if (pendingRequest) return pendingRequest;

  const hasCachedItems = cachedState.items.length > 0;
  setWorkOrderMentionCandidateState(order, {
    status: hasCachedItems ? "loaded" : "loading",
    error: "",
    needsRefresh: false,
    refreshing: true,
  });

  const request = (async () => {
    let data;
    let error;
    try {
      ({ data, error } = await supabaseClient.rpc("list_work_order_comment_mention_candidates", {
        target_work_order_id: order.dbId,
      }));
    } catch (requestError) {
      error = requestError;
    }

    if (error) {
      debugInteraction("work-order-mentions:candidates-error", {
        orderId: order.dbId,
        code: order.id,
        message: error.message || "",
        errorCode: error.code || "",
      });
      setWorkOrderMentionCandidateState(order, {
        status: hasCachedItems ? "loaded" : "error",
        error: error.message || "No se pudieron cargar las personas.",
        needsRefresh: false,
        refreshing: false,
      });
      return workOrderMentionCandidateState(order).items;
    }

    const items = (data || []).map((candidate) => ({
      id: candidate.id,
      name: candidate.full_name || "Usuario interno",
      role: candidate.role || "",
      email: candidate.email || "",
    }));
    setWorkOrderMentionCandidateState(order, {
      status: "loaded",
      items,
      error: "",
      fetchedAt: new Date().toISOString(),
      needsRefresh: false,
      refreshing: false,
    });
    debugInteraction("work-order-mentions:candidates-loaded", {
      orderId: order.dbId,
      code: order.id,
      count: items.length,
    });
    return items;
  })();

  workOrderMentionCandidateRequests.set(key, request);
  try {
    return await request;
  } finally {
    if (workOrderMentionCandidateRequests.get(key) === request) {
      workOrderMentionCandidateRequests.delete(key);
    }
  }
}

async function loadWorkOrderConversation(order, { force = false } = {}) {
  if (!order) return;
  if (!isSupabaseMode() || !order.dbId) {
    setWorkOrderConversationState(order, { status: "loaded", comments: [], error: "" });
    return;
  }

  const currentState = workOrderConversationState(order);
  const shouldLoadComments = force || currentState.status === "idle";
  const candidateState = workOrderMentionCandidateState(order);
  const shouldRefreshCandidates = canParticipateInWorkOrderConversation(order)
    && (force || candidateState.status === "idle" || candidateState.needsRefresh);
  const candidatesPromise = shouldRefreshCandidates
    ? refreshWorkOrderMentionCandidates(order, { force: true })
    : Promise.resolve(candidateState.items);

  if (!shouldLoadComments) {
    await candidatesPromise;
    return;
  }

  setWorkOrderConversationState(order, { status: "loading", error: "" });

  const commentsPromise = supabaseClient
    .from("work_order_comments")
    .select(
      "id,work_order_id,author_user_id,parent_comment_id,message,comment_type,requires_response,resolution_status,resolved_by,resolved_at,created_at,updated_at,mentions:work_order_comment_mentions(id,mentioned_user_id,mentioned_by_user_id,event_key,read_at,created_at,mentioned_profile:profiles!work_order_comment_mentions_mentioned_user_id_fkey(full_name))",
    )
    .eq("work_order_id", order.dbId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  const [{ data, error }] = await Promise.all([commentsPromise, candidatesPromise]);

  if (error) {
    debugInteraction("work-order-conversation:load-error", {
      orderId: order.dbId,
      code: order.id,
      message: error.message || "",
      codeValue: error.code || "",
    });
    setWorkOrderConversationState(order, {
      status: "error",
      error: error.message || "No se pudo cargar la conversación.",
    });
  } else {
    setWorkOrderConversationState(order, {
      status: "loaded",
      comments: (data || []).map(mapDbWorkOrderComment),
      error: "",
    });
  }

  if (shouldRenderConversationForOrder(order)) render();
}

function renderWorkOrderConversationTypeOptions(activeType = "comment") {
  return Object.entries(workOrderConversationTypeLabels)
    .map(
      ([value, label]) =>
        `<option value="${escapeHtml(value)}" ${value === activeType ? "selected" : ""}>${escapeHtml(label)}</option>`,
    )
    .join("");
}

function renderWorkOrderConversationAuthor(comment) {
  const author = users.find((user) => user.id === comment.authorId);
  return `
    <div class="work-order-conversation-author">
      <strong>${escapeHtml(author?.name || "Usuario interno")}</strong>
      <span>${escapeHtml(roleLabels[author?.role] || author?.role || "Rol no disponible")}</span>
      <time datetime="${escapeHtml(comment.createdAt)}">${escapeHtml(formatDateTime(comment.createdAt))}</time>
    </div>
  `;
}

function workOrderMentionedUserName(userId) {
  const loadedUser = users.find((user) => user.id === userId);
  if (loadedUser?.name) return loadedUser.name;
  for (const candidateState of Object.values(state.workOrderMentionCandidates)) {
    const candidate = candidateState.items?.find((item) => item.id === userId);
    if (candidate?.name) return candidate.name;
  }
  return "";
}

function renderStructuredMentionedText(value, mentions = []) {
  const source = String(value || "");
  const normalizedMentions = Array.isArray(mentions) ? mentions : [];
  if (!normalizedMentions.length) return renderLinkedText(source);

  const matches = [];
  const occupied = [];
  normalizedMentions.forEach((mention) => {
    const name = mention.name || workOrderMentionedUserName(mention.userId);
    if (!name) return;
    const token = `@${name}`;
    let index = source.indexOf(token);
    while (index >= 0 && occupied.some(([start, end]) => index < end && index + token.length > start)) {
      index = source.indexOf(token, index + token.length);
    }
    if (index < 0) return;
    occupied.push([index, index + token.length]);
    matches.push({ index, token, name, userId: mention.userId });
  });
  if (!matches.length) return renderLinkedText(source);

  matches.sort((left, right) => left.index - right.index);
  let cursor = 0;
  let html = "";
  matches.forEach((match) => {
    html += renderLinkedText(source.slice(cursor, match.index));
    html += `<span class="work-order-comment-mention" data-mentioned-user-id="${escapeHtml(
      match.userId,
    )}">@${escapeHtml(match.name)}</span>`;
    cursor = match.index + match.token.length;
  });
  html += renderLinkedText(source.slice(cursor));
  return html;
}

function renderStructuredWorkOrderCommentMessage(comment) {
  const mentions = Array.isArray(comment.mentions) ? comment.mentions : [];
  return renderStructuredMentionedText(comment.message, mentions);
}

function renderWorkOrderMentionDraftSummary(order, parentCommentId = "") {
  const draft = workOrderMentionDraft(order, parentCommentId);
  if (!draft.mentions.length) return "";
  return `
    <div class="work-order-mention-selection" aria-label="Personas mencionadas">
      ${draft.mentions
        .map(
          (mention) => `
            <span class="work-order-mention-chip">
              @${escapeHtml(mention.name)}
              <button type="button" data-action="remove-work-order-mention" data-id="${escapeHtml(
                mention.userId,
              )}" data-mention-draft-key="${escapeHtml(workOrderMentionDraftKey(order, parentCommentId))}" aria-label="Quitar mención de ${escapeHtml(mention.name)}">×</button>
            </span>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderWorkOrderMentionInput(order, parentCommentId = "") {
  const draftKey = workOrderMentionDraftKey(order, parentCommentId);
  return `
    ${renderWorkOrderMentionDraftSummary(order, parentCommentId)}
    <div class="work-order-mention-dropdown" data-mention-dropdown="${escapeHtml(draftKey)}" hidden></div>
  `;
}

function renderWorkOrderConversationReply(order, reply) {
  return `
    <article class="work-order-conversation-reply" id="work-order-comment-${escapeHtml(reply.id)}" data-work-order-comment-id="${escapeHtml(reply.id)}">
      ${renderWorkOrderConversationAuthor(reply, order)}
      <span class="badge neutral">${escapeHtml(workOrderConversationTypeLabels[reply.commentType] || "Comentario")}</span>
      <div class="work-order-conversation-message">${renderStructuredWorkOrderCommentMessage(reply)}</div>
    </article>
  `;
}

function renderWorkOrderConversationReplyForm(order, rootComment) {
  if (state.workOrderConversationReplyingTo !== rootComment.id) return "";
  return `
    <div class="work-order-conversation-reply-form" data-conversation-reply-form="${escapeHtml(rootComment.id)}">
      <label class="field">
        <span>Tipo de respuesta</span>
        <select class="input" data-conversation-reply-type>
          ${renderWorkOrderConversationTypeOptions()}
        </select>
      </label>
      <div class="field work-order-conversation-message-field">
        <label for="conversation-reply-${escapeHtml(rootComment.id)}">Respuesta</label>
        <textarea class="textarea compact-textarea" data-conversation-reply-message data-mention-draft-key="${escapeHtml(
          workOrderMentionDraftKey(order, rootComment.id),
        )}" data-parent-comment-id="${escapeHtml(rootComment.id)}" id="conversation-reply-${escapeHtml(rootComment.id)}" maxlength="4000" placeholder="Escribe una respuesta o usa @ para mencionar..."></textarea>
        ${renderWorkOrderMentionInput(order, rootComment.id)}
      </div>
      <div class="row wrap work-order-conversation-form-actions">
        <button class="button small" type="button" data-action="publish-work-order-comment-reply" data-id="${escapeHtml(rootComment.id)}" data-order-id="${escapeHtml(order.id)}">Publicar respuesta</button>
        <button class="button-ghost small" type="button" data-action="cancel-work-order-comment-reply">Cancelar</button>
      </div>
    </div>
  `;
}

function renderWorkOrderConversationTopic(order, rootComment, replies) {
  const isResolved = rootComment.resolutionStatus === "resolved";
  const canWrite = canParticipateInWorkOrderConversation(order) && !isResolved;
  const canResolve = canResolveWorkOrderConversationTopic(order, rootComment);
  return `
    <article class="work-order-conversation-topic ${isResolved ? "is-resolved" : ""}" id="work-order-comment-${escapeHtml(rootComment.id)}" data-work-order-comment-id="${escapeHtml(rootComment.id)}">
      <div class="work-order-conversation-topic-head">
        ${renderWorkOrderConversationAuthor(rootComment, order)}
        <div class="row wrap work-order-conversation-badges">
          <span class="badge ${rootComment.commentType === "block" ? "red" : rootComment.commentType === "decision" ? "green" : "blue"}">${escapeHtml(workOrderConversationTypeLabels[rootComment.commentType] || "Comentario")}</span>
          ${rootComment.requiresResponse && !isResolved ? `<span class="badge amber">Requiere respuesta</span>` : ""}
          ${isResolved ? `<span class="badge green">Resuelto</span>` : `<span class="badge neutral">Abierto</span>`}
        </div>
      </div>
      <div class="work-order-conversation-message">${renderStructuredWorkOrderCommentMessage(rootComment)}</div>
      ${
        rootComment.resolvedAt
          ? `<div class="small-muted">Resuelto por ${escapeHtml(userName(rootComment.resolvedBy))} · ${escapeHtml(formatDateTime(rootComment.resolvedAt))}</div>`
          : ""
      }
      ${
        replies.length
          ? `<div class="work-order-conversation-replies">${replies.map((reply) => renderWorkOrderConversationReply(order, reply)).join("")}</div>`
          : ""
      }
      ${
        canWrite || canResolve
          ? `
            <div class="row wrap work-order-conversation-topic-actions">
              ${canWrite ? `<button class="button-ghost small" type="button" data-action="reply-work-order-comment" data-id="${escapeHtml(rootComment.id)}">Responder</button>` : ""}
              ${canResolve ? `<button class="button-ghost small" type="button" data-action="resolve-work-order-comment" data-id="${escapeHtml(rootComment.id)}" data-order-id="${escapeHtml(order.id)}" ${state.workOrderConversationResolvingId === rootComment.id ? 'disabled aria-busy="true"' : ""}>${state.workOrderConversationResolvingId === rootComment.id ? "Resolviendo..." : "Marcar como resuelto"}</button>` : ""}
            </div>
          `
          : ""
      }
      ${renderWorkOrderConversationReplyForm(order, rootComment)}
    </article>
  `;
}

function renderWorkOrderConversation(order) {
  const conversation = workOrderConversationState(order);
  const isArchived = isArchivedWorkOrder(order);
  const canWrite = canParticipateInWorkOrderConversation(order);
  const rootComments = conversation.comments.filter((comment) => !comment.parentCommentId);
  const repliesByRoot = new Map();
  conversation.comments
    .filter((comment) => comment.parentCommentId)
    .forEach((comment) => {
      const replies = repliesByRoot.get(comment.parentCommentId) || [];
      replies.push(comment);
      repliesByRoot.set(comment.parentCommentId, replies);
    });

  return `
    <section class="work-order-conversation" aria-labelledby="work-order-conversation-title">
      <div class="work-order-conversation-header">
        <div>
          <h3 id="work-order-conversation-title">Conversación de la orden</h3>
          <p>Bloqueos, solicitudes, respuestas y decisiones permanentes de esta OT.</p>
        </div>
        ${rootComments.some((comment) => comment.requiresResponse && comment.resolutionStatus === "open") ? `<span class="badge amber">Respuesta pendiente</span>` : ""}
      </div>
      ${isArchived ? `<div class="work-order-conversation-readonly">Orden archivada: la conversación permanece visible en modo solo lectura.</div>` : ""}
      ${
        canWrite
          ? `
            <div class="work-order-conversation-composer" data-work-order-conversation-form="${escapeHtml(order.id)}">
              <label class="field">
                <span>Tipo</span>
                <select class="input" data-conversation-type>
                  ${renderWorkOrderConversationTypeOptions()}
                </select>
              </label>
              <div class="field work-order-conversation-message-field">
                <label for="work-order-conversation-message">Mensaje</label>
                <textarea class="textarea" data-conversation-message data-mention-draft-key="${escapeHtml(
                  workOrderMentionDraftKey(order),
                )}" data-parent-comment-id="" id="work-order-conversation-message" maxlength="4000" placeholder="Escribe un bloqueo, solicitud o usa @ para mencionar..."></textarea>
                ${renderWorkOrderMentionInput(order)}
              </div>
              <label class="checkbox-line work-order-conversation-response-toggle">
                <input type="checkbox" data-conversation-requires-response />
                Requiere respuesta
              </label>
              <button class="button" type="button" data-action="publish-work-order-comment" data-id="${escapeHtml(order.id)}" ${state.workOrderConversationPublishing ? 'disabled aria-busy="true"' : ""}>
                ${state.workOrderConversationPublishing ? "Publicando..." : "Publicar"}
              </button>
            </div>
          `
          : ""
      }
      <div class="work-order-conversation-list">
        ${
          conversation.status === "loading" || conversation.status === "idle"
            ? `<div class="small-muted">Cargando conversación...</div>`
            : conversation.status === "error"
              ? `<div class="auth-error">No se pudo cargar la conversación: ${escapeHtml(conversation.error)}</div>`
              : rootComments.length
                ? rootComments
                    .map((rootComment) =>
                      renderWorkOrderConversationTopic(order, rootComment, repliesByRoot.get(rootComment.id) || []),
                    )
                    .join("")
                : `<div class="empty compact-empty">Todavía no hay mensajes en esta orden.</div>`
        }
      </div>
    </section>
  `;
}

function mapDbWorkOrderMentionInboxItem(row) {
  return {
    id: row.mention_id,
    commentId: row.comment_id,
    workOrderDbId: row.work_order_id,
    orderCode: row.work_order_code || "OT",
    orderTitle: row.work_order_title || "Orden de trabajo",
    brandId: row.brand_id || "",
    authorId: row.author_user_id || "",
    authorName: row.author_name || "Usuario interno",
    authorRole: row.author_role || "",
    excerpt: row.message_excerpt || "",
    createdAt: row.created_at || "",
    readAt: row.read_at || "",
    archivedAt: row.archived_at || "",
  };
}

function unreadWorkOrderMentionCount() {
  return state.mentionInbox.items.filter((item) => !item.readAt).length;
}

async function loadMyWorkOrderMentions({ force = false } = {}) {
  if (!isSupabaseMode() || !dataState.session || normalizeRoleKey(dataState.profile?.role) === "cliente") return;
  if (!force && ["loading", "loaded"].includes(state.mentionInbox.status)) return;
  state.mentionInbox = { ...state.mentionInbox, status: "loading", error: "" };

  const { data, error } = await supabaseClient.rpc("list_my_work_order_comment_mentions", {
    page_size: 50,
    before_created_at: null,
  });
  if (error) {
    state.mentionInbox = {
      ...state.mentionInbox,
      status: "error",
      error: error.message || "No se pudieron cargar tus menciones.",
    };
  } else {
    state.mentionInbox = {
      status: "loaded",
      items: (data || []).map(mapDbWorkOrderMentionInboxItem),
      error: "",
    };
  }
  render();
}

async function toggleWorkOrderMentionInbox() {
  state.mentionInboxOpen = !state.mentionInboxOpen;
  render();
  if (state.mentionInboxOpen) await loadMyWorkOrderMentions({ force: true });
}

function closeWorkOrderMentionInbox() {
  state.mentionInboxOpen = false;
  render();
}

async function openWorkOrderMention(mentionId, actionElement) {
  const mention = state.mentionInbox.items.find((item) => item.id === mentionId);
  if (!mention) return;

  if (!mention.readAt) {
    const { data, error } = await supabaseClient.rpc("mark_work_order_comment_mention_read", {
      target_mention_id: mention.id,
    });
    if (error) {
      showToast(`No se pudo marcar la mención: ${error.message}`);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    state.mentionInbox.items = state.mentionInbox.items.map((item) =>
      item.id === mention.id ? { ...item, readAt: row?.read_at || new Date().toISOString() } : item,
    );
  }

  const order = findWorkOrderByAnyId(mention.workOrderDbId)
    || findWorkOrderByAnyId(actionElement?.dataset?.orderCode || mention.orderCode);
  if (!order) {
    showToast("No se pudo abrir la orden relacionada.");
    return;
  }

  state.mentionInboxOpen = false;
  setActiveWorkOrderNavigation(order, {
    commentId: mention.commentId,
    historyMode: "push",
  });
  markWorkOrderMentionCandidatesStale(order);
  render();
}

function renderWorkOrderMentionInboxPanel() {
  if (!state.mentionInboxOpen) return "";
  const inbox = state.mentionInbox;
  return `
    <button class="mention-inbox-backdrop" type="button" data-action="close-mention-inbox" aria-label="Cerrar Mis menciones"></button>
    <aside class="mention-inbox-panel" role="dialog" aria-modal="true" aria-labelledby="mention-inbox-title">
      <div class="mention-inbox-header">
        <div>
          <h2 id="mention-inbox-title">Mis menciones</h2>
          <p>${unreadWorkOrderMentionCount()} sin leer</p>
        </div>
        <button class="drawer-close-button" type="button" data-action="close-mention-inbox" aria-label="Cerrar">×</button>
      </div>
      <div class="mention-inbox-list">
        ${
          inbox.status === "loading" || inbox.status === "idle"
            ? `<div class="small-muted">Cargando menciones...</div>`
            : inbox.status === "error"
              ? `<div class="auth-error">${escapeHtml(inbox.error)}</div>`
              : inbox.items.length
                ? inbox.items
                    .map(
                      (item) => `
                        <button
                          class="mention-inbox-item ${item.readAt ? "is-read" : "is-unread"}"
                          type="button"
                          data-action="open-work-order-mention"
                          data-id="${escapeHtml(item.id)}"
                          data-order-id="${escapeHtml(item.workOrderDbId)}"
                          data-order-code="${escapeHtml(item.orderCode)}"
                          data-brand-id="${escapeHtml(item.brandId)}"
                          data-comment-id="${escapeHtml(item.commentId)}"
                        >
                          <span class="mention-inbox-item-head">
                            <strong>${escapeHtml(item.authorName)}</strong>
                            ${item.readAt ? "" : `<span class="mention-unread-dot" aria-label="Sin leer"></span>`}
                          </span>
                          <span>${escapeHtml(item.orderCode)} · ${escapeHtml(item.orderTitle)}</span>
                          <span class="mention-inbox-excerpt">${escapeHtml(item.excerpt)}</span>
                          <time datetime="${escapeHtml(item.createdAt)}">${escapeHtml(formatDateTime(item.createdAt))}</time>
                        </button>
                      `,
                    )
                    .join("")
                : `<div class="empty compact-empty">Todavía no tienes menciones.</div>`
        }
      </div>
    </aside>
  `;
}

function focusLinkedWorkOrderComment() {
  if (!state.focusedWorkOrderCommentId && !state.focusedWorkOrderPhaseCommentId) return;
  const conversationOrder = selectedViewingOrder();
  if (!conversationOrder) return;
  if (state.focusedWorkOrderCommentId && workOrderConversationState(conversationOrder).status !== "loaded") return;
  window.setTimeout(() => {
    const selector = state.focusedWorkOrderPhaseCommentId
      ? `[data-work-order-phase-comment-id="${CSS.escape(state.focusedWorkOrderPhaseCommentId)}"]`
      : `[data-work-order-comment-id="${CSS.escape(state.focusedWorkOrderCommentId)}"]`;
    const comment = document.querySelector(selector);
    if (!comment) return;
    comment.classList.add("is-deep-linked");
    comment.scrollIntoView({ block: "center", behavior: "smooth" });
    window.setTimeout(() => comment.classList.remove("is-deep-linked"), 4200);
    clearConsumedWorkOrderCommentRoute();
    state.focusedWorkOrderCommentId = "";
    state.focusedWorkOrderPhaseId = "";
    state.focusedWorkOrderPhaseCommentId = "";
  }, 80);
}

function renderWorkOrderPhaseComments(phase, order) {
  const comments = Array.isArray(phase.comments) ? phase.comments : [];
  const canComment = canCommentOnWorkOrderPhase(phase, order);
  debugInteraction("phase-comments:render", {
    phaseId: phase.id,
    phaseDbId: phase.dbId || "",
    workOrderId: order?.id || "",
    code: order?.id || order?.code || "",
    count: comments.length,
    sample: comments.slice(0, 2),
  });
  return `
    <div class="phase-comments">
      <div class="phase-comments-list">
        ${
          !dataState.phaseCommentsReady
            ? `<div class="small-muted">No se pudieron cargar los comentarios de fases. Revisa permisos o consola.</div>`
            : comments.length
            ? comments
                .map(
                  (comment) => `
                    <article class="phase-comment ${state.focusedWorkOrderPhaseCommentId === comment.id ? "is-deep-linked" : ""}" id="work-order-phase-comment-${escapeHtml(comment.id)}" data-work-order-phase-comment-id="${escapeHtml(comment.id)}">
                      ${renderWorkOrderConversationAuthor(comment, order, "phase")}
                      <p>${renderLinkedText(comment.body)}</p>
                    </article>
                  `,
                )
                .join("")
            : `<div class="small-muted">Sin avances comentados en esta fase.</div>`
        }
      </div>
      ${
        canComment
          ? `
            <div class="phase-comment-form">
              <div class="work-order-conversation-message-field">
                <textarea class="textarea compact-textarea" data-phase-comment-input="${escapeHtml(phase.id)}" maxlength="2000" placeholder="Escribe un avance o pega un link..."></textarea>
              </div>
              <button class="button-ghost small" data-action="add-work-order-phase-comment" data-id="${escapeHtml(phase.id)}" ${state.workOrderPhaseCommentPublishingIds.has(phase.id) ? 'disabled aria-busy="true"' : ""}>${state.workOrderPhaseCommentPublishingIds.has(phase.id) ? "Publicando..." : "Agregar comentario"}</button>
            </div>
          `
          : ""
      }
    </div>
  `;
}

function usersForBrandByRoles(roles = [], brandId = state.currentBrandId) {
  const roleSet = new Set(roles);
  return activeUsers()
    .filter((user) => user.role !== "cliente" && roleSet.has(user.role) && user.email && canUserAccessBrand(user, brandId))
    .sort((a, b) => {
      const aLoad = workloadScoreForUser(a.id);
      const bLoad = workloadScoreForUser(b.id);
      return aLoad - bLoad || a.name.localeCompare(b.name);
    });
}

function executionCandidates(category = "diseno", brandId = state.currentBrandId) {
  const area = workOrderProcessArea(category);
  const candidates = usersForBrandByRoles(area.executionRoles, brandId);
  if (candidates.length) return candidates;
  return activeUsers().filter((user) => user.role !== "cliente" && canUserAccessBrand(user, brandId));
}

function workloadScoreForUser(userId, sourceOrders = workOrders) {
  const workload = teamWorkload(userId, sourceOrders);
  const dueSoon = workload.open.filter((order) => daysUntil(workOrderEffectiveDueDate(order)) <= 2).length;
  const urgent = workload.open.filter(isUrgentWorkOrder).length;
  return workload.open.length * 2 + workload.overdue.length * 5 + workload.review.length * 2 + dueSoon * 2 + urgent * 3;
}

function workloadLabelForUser(userId) {
  const workload = teamWorkload(userId);
  return `${workload.open.length} abiertas / ${workload.overdue.length} vencidas`;
}

function addBusinessDays(startDate, amount) {
  const date = new Date(startDate);
  let added = 0;
  while (added < amount) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return date;
}

function urgentWorkOrderPlan({ category = "diseno", brandId = state.currentBrandId, priority = "medium" } = {}) {
  const candidates = executionCandidates(category, brandId);
  const ranked = candidates
    .map((user) => ({
      user,
      score: workloadScoreForUser(user.id),
      workload: teamWorkload(user.id),
    }))
    .sort((a, b) => a.score - b.score || a.user.name.localeCompare(b.user.name));
  const best = ranked[0] || null;
  const baseDaysByCategory = {
    arte_final: 1,
    edicion: 2,
    diseno: 2,
    produccion: 3,
    matriz: 3,
    pauta: 2,
  };
  const loadDelay = best ? Math.min(4, Math.floor(best.score / 5)) : 2;
  const baseDays = baseDaysByCategory[category] || 2;
  const days = Math.max(1, priority === "high" ? baseDays + loadDelay : baseDays + loadDelay + 1);
  const dueDate = isoDateFromDate(addBusinessDays(todayAtNoon(), days));
  return {
    candidate: best?.user || null,
    candidateScore: best?.score || 0,
    candidates: ranked.slice(0, 4),
    dueDate,
    reason: best
      ? `${best.user.name} tiene ${best.workload.open.length} tareas abiertas, ${best.workload.review.length} en revisión y ${best.workload.overdue.length} vencidas.`
      : "No hay responsables disponibles para esta marca; deja las fases sin asignar y complétalas manualmente.",
  };
}

function processStepIndex(order) {
  if (!order || order.status === "cancelled") return -1;
  const statusMap = {
    new: 0,
    in_progress: 2,
    in_review: 3,
    completed: 5,
    client_approved: 5,
    scheduled: 5,
  };
  return statusMap[order.status] ?? 0;
}

function weeklyDigestRows(sourceOrders = workOrders) {
  return internalUsers().map((user) => {
    const workload = teamWorkload(user.id, sourceOrders);
    return {
      user,
      open: workload.open.length,
      overdue: workload.overdue.length,
      review: workload.review.length,
      next: workload.open
        .slice()
        .sort((a, b) => safeLocaleCompare(a?.dueDate, b?.dueDate))[0],
      collaborators: workload.open.filter((order) => orderAssignees(order).length > 1).length,
    };
  });
}

function brandProductions(brandId = state.currentBrandId) {
  if (isAllBrandsScope(brandId)) return productions;
  return productions.filter((production) => production.brandId === brandId);
}

function relatedProductions(brandId = state.currentBrandId) {
  if (isAllBrandsScope(brandId)) return productions;
  const contentIds = brandItems(brandId).map((item) => item.id);
  return productions.filter(
    (production) =>
      production.brandId === brandId ||
      production.deliverables.some((deliverable) => contentIds.includes(deliverable)),
  );
}

function getAsset(id) {
  return assetVersions.find((asset) => asset.id === id);
}

function getCanvaDesign(id) {
  return canvaDesigns.find((design) => design.id === id);
}

function safeLocaleCompare(left, right) {
  return String(left ?? "")
    .trim()
    .localeCompare(String(right ?? "").trim(), "es", {
      sensitivity: "base",
      numeric: true,
    });
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  const dateOnlyLabel = formatDateOnly(value);
  if (dateOnlyLabel) return dateOnlyLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  const date = new Date(value);
  return date.toLocaleString("es-GT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWorkOrderCreatedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return date.toLocaleString("es-GT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function workOrderCreatorName(order) {
  return users.find((user) => user.id === order?.createdBy)?.name || "Usuario Lumen";
}

function clsStatus(status) {
  if (status === "approved" || status === "completed" || status === "published") return "green";
  if (status === "client_review" || status === "internal_review") return "blue";
  if (status === "changes_requested") return "red";
  return "amber";
}

function captureWorkOrderDetailScrollPosition() {
  const order = selectedViewingOrder();
  const panel = document.querySelector(".drawer-panel");
  if (!order || !panel) return null;
  return {
    orderKey: workOrderConversationKey(order),
    scrollTop: panel.scrollTop || 0,
  };
}

function restoreWorkOrderDetailScrollPosition(previousPosition) {
  if (!previousPosition) return;
  if (state.focusedWorkOrderCommentId || state.focusedWorkOrderPhaseCommentId) return;
  const order = selectedViewingOrder();
  if (!order || workOrderConversationKey(order) !== previousPosition.orderKey) return;
  const panel = document.querySelector(".drawer-panel");
  if (!panel) return;
  panel.scrollTop = previousPosition.scrollTop;
}

function render() {
  if (isSupabaseMode() && dataState.loading && !dataState.initialized) {
    document.getElementById("app").innerHTML = renderLoadingScreen();
    return;
  }

  if (isSupabaseMode() && !dataState.session) {
    document.getElementById("app").innerHTML = renderLoginScreen();
    bindAuthEvents();
    return;
  }

  if (isSupabaseMode() && dataState.passwordResetMode) {
    document.getElementById("app").innerHTML = renderPasswordResetScreen();
    bindAuthEvents();
    return;
  }

  if (!canOpenModule(state.currentModule)) {
    state.currentModule = "dashboard";
    state.creatingWorkOrder = false;
    state.workOrderSubmitting = false;
    state.editingWorkOrderId = "";
    state.viewingWorkOrderId = "";
  }

  const allBrands = isAllBrandsScope();
  const brand = allBrands ? null : getBrand();
  const canCreate = canCreateWorkOrders();
  const canViewReports = canOpenModule("reports");
  const detailScrollPosition = captureWorkOrderDetailScrollPosition();
  document.documentElement.style.setProperty("--brand-color", allBrands ? "#2d2d2d" : brand.color);
  document.getElementById("app").innerHTML = `
    <div class="workspace">
      <aside id="workspace-sidebar" class="sidebar ${state.mobileNavOpen ? "open" : ""}" aria-label="Navegación principal">
        <div class="sidebar-mobile-header">
          <strong>Menú</strong>
          <button class="sidebar-close-button" type="button" data-action="close-mobile-nav" aria-label="Cerrar menú">
            ${iconSvg("close")}
          </button>
        </div>
        <div class="brand-mark">
          ${renderLumenLogo("brand-logo-img")}
        </div>
        <div class="selector-wrap">
          <label>Marca activa</label>
          <select class="brand-select js-brand-select">
            ${renderBrandOptions(state.currentBrandId)}
          </select>
        </div>
        <nav class="nav">
          ${renderSidebarNav()}
        </nav>
        <div class="sidebar-footer">
          <div class="user-block">
            <strong>${dataState.profile?.full_name || "Usuario"}</strong>
            <span>${dataState.profile?.email || "Sin sesion activa"}</span>
            <span>${isSupabaseMode() ? "Supabase conectado" : "Modo demo local"}</span>
          </div>
          <button class="button-ghost logout" data-action="logout">Cerrar sesion</button>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <button
            class="mobile-menu-button"
            type="button"
            data-action="toggle-mobile-nav"
            aria-label="Abrir menú"
            aria-controls="workspace-sidebar"
            aria-expanded="${state.mobileNavOpen ? "true" : "false"}"
          >
            ${iconSvg("menu")}
          </button>
          <div class="topbar-title">
            <h1>${moduleDisplayLabel(getModuleMeta())}</h1>
            <div class="topbar-subtitle">${getScopeSubtitle()}</div>
          </div>
          <div class="topbar-actions">
            <select class="brand-select topbar-brand-select js-brand-select" aria-label="Marca activa">
              ${renderBrandOptions(state.currentBrandId)}
            </select>
            ${
              normalizeRoleKey(dataState.profile?.role) !== "cliente"
                ? `<button class="button-ghost small mention-inbox-trigger" type="button" data-action="toggle-mention-inbox" aria-label="Abrir Mis menciones">
                    ${iconSvg("notifications")}
                    <span>Mis menciones</span>
                    ${unreadWorkOrderMentionCount() ? `<strong>${unreadWorkOrderMentionCount()}</strong>` : ""}
                  </button>`
                : ""
            }
            ${canCreate ? `<button class="button small topbar-create" data-action="open-create-work-order">+ Crear OT</button>` : ""}
            <button class="button-ghost small" data-module="work-orders">OTs</button>
            ${canViewReports ? `<button class="button-ghost small" data-module="reports">Reportería</button>` : ""}
          </div>
        </header>
        <div class="content">
          ${renderModule()}
        </div>
      </main>
    </div>
    ${renderWorkOrderMentionInboxPanel()}
    ${state.mobileNavOpen ? `<button class="mobile-nav-backdrop" type="button" data-action="close-mobile-nav" aria-label="Cerrar menú"></button>` : ""}
    ${state.toast ? `<div class="toast">${state.toast}</div>` : ""}
    ${renderDebugInteractionsPanel()}
  `;
  bindEvents();
  restoreWorkOrderDetailScrollPosition(detailScrollPosition);
  if (isSupabaseMode() && dataState.session && state.mentionInbox.status === "idle") {
    loadMyWorkOrderMentions().catch((error) => {
      debugInteraction("work-order-mentions:inbox-unhandled", { message: error?.message || "" });
    });
  }
  focusLinkedWorkOrder();
  const conversationOrder = selectedViewingOrder();
  if (conversationOrder) {
    loadWorkOrderConversation(conversationOrder).catch((error) => {
      debugInteraction("work-order-conversation:load-unhandled", {
        orderId: conversationOrder.dbId || conversationOrder.id,
        message: error?.message || "",
      });
    });
  }
  focusLinkedWorkOrderComment();
}

function renderLoadingScreen() {
  return `
    <main class="auth-screen">
      <section class="auth-card">
        ${renderLumenLogo("auth-logo-img")}
        <h1>Lumen Workspace</h1>
        <p class="muted">Conectando con Supabase...</p>
      </section>
    </main>
  `;
}

function renderLoginScreen() {
  return `
    <main class="auth-screen">
      <section class="auth-card">
        ${renderLumenLogo("auth-logo-img")}
        <h1>Lumen Workspace</h1>
        <p class="muted">Ingresa con el usuario creado en Supabase Auth.</p>
        ${dataState.error ? `<div class="auth-error">${escapeHtml(dataState.error)}</div>` : ""}
        <div class="field">
          <label>Email</label>
          <input class="input" id="login-email" type="email" autocomplete="email" placeholder="jmeza@grupolumen.com" />
        </div>
        <div class="field">
          <label>Password</label>
          <input class="input" id="login-password" type="password" autocomplete="current-password" placeholder="Tu password" />
        </div>
        <button class="button full" data-action="login">Entrar</button>
        <button class="button-ghost full" data-action="reset-password-email">Olvide mi password</button>
        <p class="small-muted">Si el usuario fue invitado, primero debe aceptar la invitacion y crear password.</p>
      </section>
    </main>
  `;
}

function renderPasswordResetScreen() {
  return `
    <main class="auth-screen">
      <section class="auth-card">
        ${renderLumenLogo("auth-logo-img")}
        <h1>Nuevo password</h1>
        <p class="muted">Crea un password nuevo para volver a entrar a Lumen Workspace.</p>
        ${dataState.error ? `<div class="auth-error">${escapeHtml(dataState.error)}</div>` : ""}
        <div class="field">
          <label>Nuevo password</label>
          <input class="input" id="new-password" type="password" autocomplete="new-password" placeholder="Minimo 8 caracteres" />
        </div>
        <div class="field">
          <label>Confirmar password</label>
          <input class="input" id="confirm-password" type="password" autocomplete="new-password" placeholder="Repite el password" />
        </div>
        <button class="button full" data-action="update-recovery-password">Guardar password</button>
      </section>
    </main>
  `;
}

function renderModule() {
  const views = {
    dashboard: renderDashboard,
    calendar: renderCalendarWorkspace,
    brands: renderBrandsWorkspace,
    "brand-config": renderBrandConfig,
    "work-orders": renderWorkOrders,
    "production-planner": renderProductionPlanner,
    notifications: renderNotifications,
    productions: renderProductions,
    content: renderContent,
    assets: renderAssets,
    copywriting: renderCopywriting,
    creativity: renderCreativity,
    reports: renderReports,
    team: renderTeam,
    "client-portal": renderClientPortal,
    profile: renderProfile,
    settings: renderSettings,
  };
  return (views[state.currentModule] || renderDashboard)();
}

function renderBrandHero() {
  if (isAllBrandsScope()) return renderAllBrandsHero();
  const brand = getBrand();
  const client = getClient(brand.clientId);
  return `
    <section class="panel brand-hero">
      <div>
        <div class="hero-title">
          <h2>${brand.name}</h2>
          <span class="badge blue">${escapeHtml(client?.name || "Marca disponible")}</span>
        </div>
        <div class="badge-row">
          ${brand.platforms.map((platform) => `<span class="badge">${platform}</span>`).join("")}
          ${brand.services.map((service) => `<span class="badge green">${service}</span>`).join("")}
        </div>
      </div>
      <div class="quick-links">
        <button class="button-ghost small" data-module="work-orders">OTs</button>
        <button class="button-ghost small" data-module="team">Equipo</button>
        <button class="button-ghost small" data-module="notifications">Notificaciones</button>
      </div>
    </section>
  `;
}

function getBrandSnapshot(brand) {
  const brandOpen = workOrders.filter((order) => order.brandId === brand.id && isOpenWorkOrder(order));
  const brandReview = brandOpen.filter((order) => order.status === "in_review");
  const brandCompleted = workOrders.filter((order) => order.brandId === brand.id && isDeliveredWorkOrder(order));
  const brandOverdue = brandOpen.filter((order) => daysUntil(order.dueDate) < 0);
  const totalOrders = brandOpen.length + brandCompleted.length;
  const completion = totalOrders ? Math.round((brandCompleted.length / totalOrders) * 100) : 0;
  const risk = brandOverdue.length ? "red" : brandReview.length ? "amber" : brandOpen.length ? "blue" : "green";
  return {
    brand,
    open: brandOpen.length,
    review: brandReview.length,
    approved: brandCompleted.length,
    overdue: brandOverdue.length,
    completion,
    risk,
  };
}

function renderAllBrandsHero() {
  const globalOpenOrders = workOrders.filter(isOpenWorkOrder);
  const globalOverdueOrders = globalOpenOrders.filter((order) => daysUntil(order.dueDate) < 0);
  const globalReviewOrders = globalOpenOrders.filter((order) => order.status === "in_review");
  const activeBrands = brands.filter((brand) => brand.isActive !== false);
  return `
    <section class="panel all-hero">
      <div class="all-hero-copy">
        <span class="eyebrow">Vista general</span>
        <h2>Todas las marcas</h2>
        <p class="muted">Un tablero ejecutivo para ver tareas, responsables, vencimientos y avance sin entrar marca por marca.</p>
        <div class="badge-row">
          <span class="badge blue">${clients.length} clientes</span>
          <span class="badge green">${activeBrands.length} marcas activas</span>
          <span class="badge amber">${workOrders.length} OTs registradas</span>
          <span class="badge purple">${internalUsers().length} responsables</span>
        </div>
      </div>
      <div class="all-hero-metrics">
        <div>
          <strong>${globalOpenOrders.length}</strong>
          <span>OTs abiertas</span>
        </div>
        <div>
          <strong>${globalOverdueOrders.length}</strong>
          <span>vencidas</span>
        </div>
        <div>
          <strong>${globalReviewOrders.length}</strong>
          <span>en revisión</span>
        </div>
      </div>
    </section>
  `;
}

function renderAllBrandCard(snapshot) {
  const { brand, open, review, overdue, completion, risk } = snapshot;
  return `
    <button class="brand-mini-card" style="--accent:${brand.color}; --progress:${completion}%;" data-brand-jump="${brand.id}">
      <div class="row between">
        <strong>${brand.shortName}</strong>
        <span class="status-dot ${risk}"></span>
      </div>
      <span class="muted">${escapeHtml(getClient(brand.clientId)?.name || "Marca disponible")}</span>
      <div class="mini-progress"><div style="width:${completion}%"></div></div>
      <div class="brand-mini-meta">
        <span>${open} OTs</span>
        <span>${review} rev.</span>
        <span>${overdue} venc.</span>
      </div>
    </button>
  `;
}

function dashboardScopedOrders(options = {}) {
  return brandOrders(state.currentBrandId, options);
}

function dashboardScopedBrands() {
  return isAllBrandsScope() ? brands.filter((brand) => brand.isActive !== false) : [getBrand()];
}

function createdOrdersDashboardSourceOrders() {
  const currentUserId = dataState.session?.user?.id || "";
  const scope = state.dashboardOrderScope === "all" ? "all" : "created";
  const sourceOrders = dashboardScopedOrders({ includeArchived: true });
  if (scope === "all") return sourceOrders;
  return sourceOrders.filter((order) => order.createdBy === currentUserId);
}

function createdOrdersDashboardFilters() {
  return {
    brand: state.dashboardOrderFilters?.brand || "",
    status: state.dashboardOrderFilters?.status || "",
    priority: state.dashboardOrderFilters?.priority || "",
    createdDate: state.dashboardOrderFilters?.createdDate || "",
    dueDate: state.dashboardOrderFilters?.dueDate || "",
    archive: state.dashboardOrderFilters?.archive || "active",
  };
}

function reconcileDashboardOrderBrandFilter() {
  const filters = createdOrdersDashboardFilters();
  const scopedBrandIds = new Set(dashboardScopedBrands().map((brand) => brand?.id).filter(Boolean));
  const nextBrand = isAllBrandsScope() && scopedBrandIds.has(filters.brand) ? filters.brand : "";
  if (nextBrand !== filters.brand) {
    state.dashboardOrderFilters = { ...filters, brand: nextBrand };
  }
}

function createdOrderAssigneeIds(order) {
  return Array.from(
    new Set([
      ...orderAssignees(order),
      ...workOrderPhases(order).map((phase) => phase.assignedTo).filter(Boolean),
    ]),
  );
}

function createdOrderPhaseProgress(order) {
  const phases = workOrderPhases(order);
  if (!phases.length) return "Sin fases";
  const completed = phases.filter((phase) => phase.status === "completed").length;
  return `${completed}/${phases.length} fases`;
}

function sortCreatedOrdersDashboardRows(left, right) {
  const urgentComparison = Number(isUrgentWorkOrder(right)) - Number(isUrgentWorkOrder(left));
  if (urgentComparison) return urgentComparison;

  const leftDueDate = workOrderEffectiveDueDate(left);
  const rightDueDate = workOrderEffectiveDueDate(right);
  const leftOverdue = Boolean(leftDueDate) && isOpenWorkOrder(left) && daysUntil(leftDueDate) < 0;
  const rightOverdue = Boolean(rightDueDate) && isOpenWorkOrder(right) && daysUntil(rightDueDate) < 0;
  const overdueComparison = Number(rightOverdue) - Number(leftOverdue);
  if (overdueComparison) return overdueComparison;

  if (leftDueDate || rightDueDate) {
    if (!leftDueDate) return 1;
    if (!rightDueDate) return -1;
    const dueComparison = String(leftDueDate).localeCompare(String(rightDueDate));
    if (dueComparison) return dueComparison;
  }

  return String(right.createdAt || "").localeCompare(String(left.createdAt || ""));
}

function filteredCreatedOrdersDashboardRows() {
  const filters = createdOrdersDashboardFilters();
  return createdOrdersDashboardSourceOrders()
    .filter((order) => {
      const effectiveDueDate = workOrderEffectiveDueDate(order);
      if (filters.archive === "active" && isArchivedWorkOrder(order)) return false;
      if (filters.archive === "archived" && !isArchivedWorkOrder(order)) return false;
      if (filters.brand && order.brandId !== filters.brand) return false;
      if (filters.status && order.status !== filters.status) return false;
      if (filters.priority && order.priority !== filters.priority) return false;
      if (filters.createdDate && String(order.createdAt || "").slice(0, 10) !== filters.createdDate) return false;
      if (filters.dueDate && String(effectiveDueDate || "").slice(0, 10) !== filters.dueDate) return false;
      return true;
    })
    .sort(sortCreatedOrdersDashboardRows);
}

function createdOrdersDashboardCounts(orders) {
  const open = orders.filter(isOpenWorkOrder);
  return {
    open: open.length,
    urgent: open.filter(isUrgentWorkOrder).length,
    overdue: open.filter((order) => {
      const dueDate = workOrderEffectiveDueDate(order);
      return Boolean(dueDate) && daysUntil(dueDate) < 0;
    }).length,
    review: open.filter(
      (order) => order.status === "in_review" || workOrderPhases(order).some((phase) => phase.status === "in_review"),
    ).length,
  };
}

function renderCreatedOrderDashboardCard(order) {
  const brand = getBrand(order.brandId);
  const dueDate = workOrderEffectiveDueDate(order);
  const urgency = workOrderUrgency(order);
  const showTimingBadge = shouldRenderWorkOrderTimingBadge(order);
  const showUrgentBadge = showTimingBadge && isUrgentWorkOrder(order);
  const assigneeNames = createdOrderAssigneeIds(order).map(userName);
  return `
    <article class="created-order-card ${showUrgentBadge ? "urgent" : ""}">
      <div class="created-order-card-head">
        <div>
          <div class="created-order-code-row">
            <span class="badge blue">${escapeHtml(order.id)}</span>
            ${showUrgentBadge ? `<span class="badge red">Urgente</span>` : ""}
            ${isArchivedWorkOrder(order) ? `<span class="badge neutral">Archivada</span>` : ""}
          </div>
          <h3>${escapeHtml(order.title || "Sin título")}</h3>
          <span>${escapeHtml(brand?.shortName || brand?.name || "Sin marca")}</span>
        </div>
        ${showTimingBadge ? `<span class="badge ${urgency.cls}">${escapeHtml(urgency.label)}</span>` : ""}
      </div>
      <dl class="created-order-facts">
        <div>
          <dt>Creada</dt>
          <dd>${escapeHtml(formatDate(order.createdAt))}</dd>
        </div>
        <div>
          <dt>Entrega</dt>
          <dd>${escapeHtml(dueDate ? formatDate(dueDate) : "Sin fecha")}</dd>
        </div>
        <div>
          <dt>Prioridad</dt>
          <dd>${escapeHtml(workOrderPriorityLabels[order.priority] || order.priority || "Sin prioridad")}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>${escapeHtml(workOrderStatusLabels[order.status] || order.status || "Sin estado")}</dd>
        </div>
        <div>
          <dt>Progreso</dt>
          <dd>${escapeHtml(createdOrderPhaseProgress(order))}</dd>
        </div>
      </dl>
      <div class="created-order-assignees">
        <span>Responsables</span>
        <strong>${escapeHtml(assigneeNames.join(", ") || "Sin responsable")}</strong>
      </div>
      <button class="button-ghost small created-order-open" type="button" data-action="view-work-order" data-id="${escapeHtml(order.id)}">
        Abrir orden
      </button>
    </article>
  `;
}

function renderCreatedOrdersDashboardFilters() {
  const filters = createdOrdersDashboardFilters();
  const activeBrands = dashboardScopedBrands().filter((brand) => brand?.isActive !== false);
  const scopedBrand = !isAllBrandsScope() ? activeBrands[0] : null;
  return `
    <button
      class="button-ghost created-orders-filter-toggle"
      type="button"
      data-action="toggle-created-orders-filters"
      aria-expanded="${state.dashboardOrderFiltersOpen ? "true" : "false"}"
    >
      Filtros
    </button>
    <div class="created-orders-filters ${state.dashboardOrderFiltersOpen ? "is-open" : ""}">
      <label>
        <span>Marca</span>
        <select class="input" data-created-order-filter="brand" ${scopedBrand ? "disabled aria-disabled=\"true\"" : ""}>
          ${
            scopedBrand
              ? `<option value="">${escapeHtml(scopedBrand.shortName || scopedBrand.name)}</option>`
              : `<option value="">Todas</option>
                ${activeBrands
                  .map(
                    (brand) =>
                      `<option value="${escapeHtml(brand.id)}" ${filters.brand === brand.id ? "selected" : ""}>${escapeHtml(brand.shortName || brand.name)}</option>`,
                  )
                  .join("")}`
          }
        </select>
      </label>
      <label>
        <span>Estado</span>
        <select class="input" data-created-order-filter="status">
          <option value="">Todos</option>
          ${Object.entries(workOrderStatusLabels)
            .map(([value, label]) => `<option value="${value}" ${filters.status === value ? "selected" : ""}>${escapeHtml(label)}</option>`)
            .join("")}
        </select>
      </label>
      <label>
        <span>Prioridad</span>
        <select class="input" data-created-order-filter="priority">
          <option value="">Todas</option>
          ${Object.entries(workOrderPriorityLabels)
            .map(([value, label]) => `<option value="${value}" ${filters.priority === value ? "selected" : ""}>${escapeHtml(label)}</option>`)
            .join("")}
        </select>
      </label>
      <label>
        <span>Fecha de creación</span>
        <input class="input" type="date" value="${escapeHtml(filters.createdDate)}" data-created-order-filter="createdDate" />
      </label>
      <label>
        <span>Fecha de entrega</span>
        <input class="input" type="date" value="${escapeHtml(filters.dueDate)}" data-created-order-filter="dueDate" />
      </label>
      <label>
        <span>Visibilidad</span>
        <select class="input" data-created-order-filter="archive">
          <option value="active" ${filters.archive === "active" ? "selected" : ""}>Activas</option>
          <option value="archived" ${filters.archive === "archived" ? "selected" : ""}>Archivadas</option>
          <option value="all" ${filters.archive === "all" ? "selected" : ""}>Todas</option>
        </select>
      </label>
      <button class="button-ghost created-orders-clear" type="button" data-action="clear-created-orders-filters">Limpiar filtros</button>
    </div>
  `;
}

function renderCreatedOrdersPrimaryBlock() {
  const scope = state.dashboardOrderScope === "all" ? "all" : "created";
  const sourceOrders = createdOrdersDashboardSourceOrders();
  const orders = filteredCreatedOrdersDashboardRows();
  const counts = createdOrdersDashboardCounts(orders);
  const canCreate = canCreateWorkOrders();
  const emptyState =
    scope === "created" && !sourceOrders.length
      ? {
          title: "No has creado órdenes todavía",
          detail: "Cuando crees una orden, podrás darle seguimiento desde este espacio.",
        }
      : {
          title: "No hay órdenes con estos filtros",
          detail: "Ajusta o limpia los filtros para volver a ver las órdenes disponibles.",
        };
  return `
    <section class="created-orders-workspace">
      <div class="created-orders-toolbar">
        <div>
          <span class="eyebrow">Prioridad personal</span>
          <h2>${scope === "created" ? "Órdenes creadas por mí" : "Todas las órdenes"}</h2>
          <p>${scope === "created" ? "Seguimiento directo de las órdenes que has creado." : "Vista general de las órdenes permitidas por tus accesos actuales."}</p>
        </div>
        <div class="created-orders-toolbar-actions">
          <div class="segmented created-orders-scope" aria-label="Alcance de órdenes">
            <button type="button" class="${scope === "created" ? "active" : ""}" data-created-order-scope="created">Creadas por mí</button>
            <button type="button" class="${scope === "all" ? "active" : ""}" data-created-order-scope="all">Todas las órdenes</button>
          </div>
          ${canCreate ? `<button class="button" type="button" data-action="open-create-work-order">+ Crear OT</button>` : ""}
        </div>
      </div>
      ${renderCreatedOrdersDashboardFilters()}
      <section class="created-orders-kpis" aria-label="Resumen de órdenes">
        ${renderKpiCard("Abiertas", counts.open, "Trabajo activo", "dark")}
        ${renderKpiCard("Urgentes", counts.urgent, "Atención inmediata", counts.urgent ? "danger" : "neutral")}
        ${renderKpiCard("Vencidas", counts.overdue, "Fuera de fecha", counts.overdue ? "danger" : "neutral")}
        ${renderKpiCard("En revisión", counts.review, "Validación pendiente", "warning")}
      </section>
      <div class="created-orders-results-line">
        <strong>${orders.length} orden${orders.length === 1 ? "" : "es"}</strong>
        <span>Ordenadas por urgencia, vencimiento y fecha de entrega.</span>
      </div>
      ${
        orders.length
          ? `<div class="created-orders-grid">${orders.map(renderCreatedOrderDashboardCard).join("")}</div>`
          : `<div class="created-orders-empty">
              <h3>${escapeHtml(emptyState.title)}</h3>
              <p>${escapeHtml(emptyState.detail)}</p>
              ${
                scope === "created" && !sourceOrders.length && canCreate
                  ? `<button class="button" type="button" data-action="open-create-work-order">+ Crear OT</button>`
                  : `<button class="button-ghost" type="button" data-action="clear-created-orders-filters">Limpiar filtros</button>`
              }
            </div>`
      }
    </section>
  `;
}

function renderPriorityCreatedOrdersDashboard() {
  const activeOrders = dashboardScopedOrders();
  const activeBrands = dashboardScopedBrands();
  const urgentAndOverdue = activeOrders
    .filter((order) => {
      const dueDate = workOrderEffectiveDueDate(order);
      return isUrgentWorkOrder(order) || (dueDate && daysUntil(dueDate) < 0);
    })
    .sort(sortCreatedOrdersDashboardRows)
    .slice(0, 6);
  const reviewOrders = activeOrders
    .filter((order) => order.status === "in_review" || workOrderPhases(order).some((phase) => phase.status === "in_review"))
    .sort(sortCreatedOrdersDashboardRows)
    .slice(0, 6);

  return `
    ${renderCreatedOrdersPrimaryBlock()}
    <section class="created-orders-secondary-grid">
      <section class="panel executive-panel">
        <div class="section-header">
          <div>
            <h2 class="section-title">Urgentes y vencidas</h2>
            <div class="small-muted">Órdenes permitidas que requieren atención.</div>
          </div>
          <span class="badge ${urgentAndOverdue.length ? "red" : "neutral"}">${urgentAndOverdue.length}</span>
        </div>
        <div class="dashboard-mini-list">
          ${urgentAndOverdue.length ? urgentAndOverdue.map(renderDashboardMiniOrderRow).join("") : `<div class="empty compact-empty">No hay órdenes urgentes o vencidas.</div>`}
        </div>
      </section>
      <section class="panel executive-panel">
        <div class="section-header">
          <div>
            <h2 class="section-title">En revisión</h2>
            <div class="small-muted">Órdenes o fases en validación interna.</div>
          </div>
          <span class="badge ${reviewOrders.length ? "amber" : "neutral"}">${reviewOrders.length}</span>
        </div>
        <div class="dashboard-mini-list">
          ${reviewOrders.length ? reviewOrders.map(renderDashboardMiniOrderRow).join("") : `<div class="empty compact-empty">No hay órdenes en revisión.</div>`}
        </div>
      </section>
    </section>
    ${renderManagementBrandsDashboard(activeOrders, activeBrands)}
  `;
}

function workOrderCriticalScore(order) {
  const days = daysUntil(workOrderEffectiveDueDate(order));
  const overdueWeight = days < 0 ? Math.abs(days) * 12 : 0;
  const priorityWeight = isUrgentWorkOrder(order) ? 32 : order.priority === "high" ? 12 : order.priority === "medium" ? 8 : 0;
  const assigneeWeight = orderAssignees(order).length ? 0 : 24;
  const reviewWeight = order.status === "in_review" ? 18 : 0;
  return overdueWeight + priorityWeight + assigneeWeight + reviewWeight;
}

function criticalWorkOrders(sourceOrders = dashboardScopedOrders()) {
  return sourceOrders
    .filter((order) => {
      if (!isOpenWorkOrder(order)) return false;
      return daysUntil(workOrderEffectiveDueDate(order)) < 0 || isUrgentWorkOrder(order) || !orderAssignees(order).length || order.status === "in_review";
    })
    .sort((a, b) => workOrderCriticalScore(b) - workOrderCriticalScore(a) || daysUntil(workOrderEffectiveDueDate(a)) - daysUntil(workOrderEffectiveDueDate(b)));
}

function loadLevel(row) {
  if (row.overdue >= 4 || row.open >= 14) return { label: "Crítica", cls: "red" };
  if (row.overdue >= 2 || row.open >= 9) return { label: "Alta", cls: "amber" };
  if (row.open >= 4 || row.review >= 1) return { label: "Media", cls: "blue" };
  return { label: "Baja", cls: "neutral" };
}

function primaryBrandResponsible(brandId, sourceOrders = workOrders) {
  const counts = new Map();
  sourceOrders
    .filter((order) => order.brandId === brandId && isOpenWorkOrder(order))
    .flatMap(orderAssignees)
    .forEach((userId) => counts.set(userId, (counts.get(userId) || 0) + 1));
  const [topUserId] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0] || [];
  return topUserId ? userName(topUserId) : "Sin responsable";
}

function riskyBrandRows(sourceOrders = dashboardScopedOrders(), sourceBrands = dashboardScopedBrands()) {
  return sourceBrands
    .map((brand) => {
      const brandOpen = sourceOrders.filter((order) => order.brandId === brand.id && isOpenWorkOrder(order));
      const overdue = brandOpen.filter((order) => daysUntil(order.dueDate) < 0).length;
      const review = brandOpen.filter((order) => order.status === "in_review").length;
      const unassigned = brandOpen.filter((order) => !orderAssignees(order).length).length;
      const urgent = brandOpen.filter(isUrgentWorkOrder).length;
      return {
        brand,
        client: getClient(brand.clientId),
        open: brandOpen.length,
        overdue,
        review,
        unassigned,
        urgent,
        responsible: primaryBrandResponsible(brand.id, sourceOrders),
      };
    })
    .filter((row) => row.overdue || row.review || row.unassigned || row.urgent)
    .sort((a, b) => b.overdue - a.overdue || b.urgent - a.urgent || b.review - a.review || b.open - a.open);
}

function isActivePhase(phase) {
  return phase && !["completed", "cancelled"].includes(phase.status);
}

function phaseDueDays(phase) {
  return daysUntil(phase?.dueDate);
}

function currentUserPhaseRows(sourceOrders = dashboardScopedOrders(), userId = currentProfileId()) {
  if (!userId) return [];
  return sourceOrders
    .filter((order) => !isArchivedWorkOrder(order))
    .flatMap((order) =>
      workOrderPhases(order)
        .filter((phase) => phase.assignedTo === userId)
        .map((phase) => ({
          order,
          phase,
          brand: getBrand(order.brandId),
          dueDays: phaseDueDays(phase),
        })),
    )
    .sort((a, b) => {
      const aDate = a.phase.dueDate || "9999-12-31";
      const bDate = b.phase.dueDate || "9999-12-31";
      return aDate.localeCompare(bDate) || a.order.id.localeCompare(b.order.id);
    });
}

function userParticipatingOrders(sourceOrders = dashboardScopedOrders(), userId = currentProfileId()) {
  if (!userId) return [];
  return sourceOrders
    .filter((order) => !isArchivedWorkOrder(order))
    .filter((order) => order.createdBy === userId || orderAssignees(order).includes(userId) || workOrderPhases(order).some((phase) => phase.assignedTo === userId))
    .sort((a, b) => String(a.dueDate || "9999-12-31").localeCompare(String(b.dueDate || "9999-12-31")));
}

function phaseUrgencyBadge(phase) {
  if (phase.status === "completed") return { label: "Terminada", cls: "green" };
  if (phase.status === "cancelled") return { label: "Cancelada", cls: "neutral" };
  const days = phaseDueDays(phase);
  if (!phase.dueDate) return { label: "Sin deadline", cls: "neutral" };
  if (days < 0) return { label: `Vencida hace ${Math.abs(days)}d`, cls: "red" };
  if (days === 0) return { label: "Para hoy", cls: "red" };
  if (days <= 2) return { label: `${days}d`, cls: "amber" };
  return { label: `${days}d`, cls: "blue" };
}

function renderUserPhaseRow(row, options = {}) {
  const { order, phase, brand } = row;
  const client = getClient(brand.clientId);
  const urgency = phaseUrgencyBadge(phase);
  return `
    <article class="phase-task-row ${urgency.cls}" data-action="view-work-order" data-id="${escapeHtml(order.id)}">
      <button class="phase-task-main" data-action="view-work-order" data-id="${escapeHtml(order.id)}">
        <span class="badge">${escapeHtml(order.id)}</span>
        <strong>${escapeHtml(order.title)}</strong>
        <small>${escapeHtml(client?.name || "Cliente")} / ${escapeHtml(brand.shortName)} · ${escapeHtml(phase.title)}</small>
      </button>
      <div class="phase-task-meta">
        <span class="badge blue">${escapeHtml(workOrderPhaseStatusLabels[phase.status] || phase.status)}</span>
        <span class="badge ${urgency.cls}">${escapeHtml(urgency.label)}</span>
        <span class="muted">${escapeHtml(phase.dueDate ? formatDate(phase.dueDate) : "Sin fecha")}</span>
      </div>
      <button class="button-ghost small" data-action="view-work-order" data-id="${escapeHtml(order.id)}">${options.cta || "Abrir"}</button>
    </article>
  `;
}

function renderOperationalPhaseSection(title, subtitle, rows, emptyText, options = {}) {
  return `
    <section class="panel operational-section ${options.emphasis || ""}">
      <div class="section-header">
        <div>
          <h2 class="section-title">${escapeHtml(title)}</h2>
          <div class="small-muted">${escapeHtml(subtitle)}</div>
        </div>
        <span class="badge ${options.badgeClass || "neutral"}">${rows.length}</span>
      </div>
      <div class="phase-task-list">
        ${rows.slice(0, options.limit || 6).map((row) => renderUserPhaseRow(row, options)).join("") || `<div class="empty compact-empty">${escapeHtml(emptyText)}</div>`}
      </div>
    </section>
  `;
}

function renderOperationalOrderSearch(participatingOrders) {
  const query = (state.dashboardSearch || "").trim().toLowerCase();
  const matches = query
    ? participatingOrders.filter((order) => {
        const brand = getBrand(order.brandId);
        return [order.id, order.title, brand.shortName, getClient(brand.clientId)?.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
    : participatingOrders.slice(0, 5);

  return `
    <section class="panel operational-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Acceso rápido</h2>
          <div class="small-muted">Busca por código, título o marca dentro de tus órdenes.</div>
        </div>
      </div>
      <input class="input" data-dashboard-search value="${escapeHtml(state.dashboardSearch || "")}" placeholder="Buscar OT, marca o título..." />
      <div class="operational-order-list">
        ${
          matches.length
            ? matches
                .slice(0, 8)
                .map((order) => {
                  const brand = getBrand(order.brandId);
                  const urgency = workOrderUrgency(order);
                  return `
                    <button class="operational-order-link" data-action="view-work-order" data-id="${escapeHtml(order.id)}">
                      <span class="status-dot ${urgency.cls}"></span>
                      <strong>${escapeHtml(order.id)} · ${escapeHtml(order.title)}</strong>
                      <small>${escapeHtml(brand.shortName)} / ${escapeHtml(formatDate(order.dueDate))}</small>
                    </button>
                  `;
                })
                .join("")
            : `<div class="empty compact-empty">${query ? "No encontramos órdenes con esa búsqueda." : "No tienes órdenes asignadas todavía."}</div>`
        }
      </div>
    </section>
  `;
}

function renderKpiCard(label, value, detail, tone = "neutral") {
  return `
    <article class="kpi-card kpi-${tone}">
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
      ${detail ? `<small>${escapeHtml(detail)}</small>` : ""}
    </article>
  `;
}

function renderDashboardKpiButton(key, label, value, detail, tone = "neutral") {
  const active = state.dashboardKpiFilter === key;
  return `
    <button class="kpi-card kpi-${tone} kpi-action-card ${active ? "active" : ""}" data-dashboard-kpi="${escapeHtml(key)}" type="button">
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
      ${detail ? `<small>${escapeHtml(detail)}</small>` : ""}
    </button>
  `;
}

function dashboardSummaryRows(sourceOrders) {
  const openOrders = sourceOrders.filter(isOpenWorkOrder);
  const overdueOrders = openOrders.filter((order) => daysUntil(order.dueDate) < 0);
  const reviewOrders = openOrders.filter((order) => order.status === "in_review" || workOrderPhases(order).some((phase) => phase.status === "in_review"));
  const unassignedOrders = openOrders.filter((order) => !orderAssignees(order).length || workOrderPhases(order).some((phase) => isActivePhase(phase) && !phase.assignedTo));
  return { openOrders, overdueOrders, reviewOrders, unassignedOrders };
}

function renderDashboardMiniOrderRow(order, extra = "") {
  const brand = getBrand(order.brandId);
  const urgency = workOrderUrgency(order);
  const assignees = orderAssignees(order).map(userName).join(", ") || "Sin responsable";
  return `
    <button class="dashboard-mini-row" data-action="view-work-order" data-id="${escapeHtml(order.id)}">
      <span class="status-dot ${urgency.cls}"></span>
      <span>
        <strong>${escapeHtml(order.id)} · ${escapeHtml(order.title)}</strong>
        <small>${escapeHtml(brand.shortName)} · ${escapeHtml(assignees)} · ${escapeHtml(formatDate(order.dueDate))}${extra ? ` · ${escapeHtml(extra)}` : ""}</small>
      </span>
      <span class="badge ${urgency.cls}">${escapeHtml(urgency.label)}</span>
    </button>
  `;
}

function renderDashboardKpiDetail(sourceOrders) {
  const summaries = dashboardSummaryRows(sourceOrders);
  const key = state.dashboardKpiFilter || "open";
  const config = {
    open: { title: "OTs abiertas", empty: "No hay OTs abiertas.", rows: summaries.openOrders },
    overdue: { title: "OTs vencidas", empty: "No hay OTs vencidas.", rows: summaries.overdueOrders },
    review: { title: "OTs en revisión", empty: "No hay OTs en revisión.", rows: summaries.reviewOrders },
    unassigned: { title: "Sin responsable", empty: "No hay fases sin responsable.", rows: summaries.unassignedOrders },
  }[key] || { title: "Detalle", empty: "Sin resultados.", rows: [] };

  return `
    <section class="panel executive-panel dashboard-kpi-detail">
      <div class="section-header">
        <div>
          <h2 class="section-title">${escapeHtml(config.title)}</h2>
          <div class="small-muted">Listado filtrado desde la card seleccionada.</div>
        </div>
        <span class="badge blue">${config.rows.length} resultado${config.rows.length === 1 ? "" : "s"}</span>
      </div>
      <div class="dashboard-mini-list">
        ${config.rows.length ? config.rows.slice(0, 8).map((order) => renderDashboardMiniOrderRow(order, workOrderStatusLabels[order.status] || order.status)).join("") : `<div class="empty compact-empty">${escapeHtml(config.empty)}</div>`}
      </div>
    </section>
  `;
}

function renderManagementMyOrders(sourceOrders) {
  const orders = userParticipatingOrders(sourceOrders).slice(0, 8);
  return `
    <section class="panel executive-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">Mis órdenes pendientes</h2>
          <div class="small-muted">Tus OTs creadas, asignadas o con fases a tu cargo.</div>
        </div>
        <span class="badge blue">${orders.length} visibles</span>
      </div>
      <div class="dashboard-mini-list">
        ${orders.length ? orders.map(renderDashboardMiniOrderRow).join("") : `<div class="empty compact-empty">No tienes órdenes pendientes asignadas.</div>`}
      </div>
    </section>
  `;
}

function brandPhaseLoadRows(orders) {
  const rows = new Map();
  orders.forEach((order) => {
    workOrderPhases(order)
      .filter(isActivePhase)
      .filter((phase) => phase.assignedTo)
      .forEach((phase) => {
        const current = rows.get(phase.assignedTo) || { userId: phase.assignedTo, pending: 0, overdue: 0, review: 0 };
        current.pending += 1;
        if (phase.dueDate && phaseDueDays(phase) < 0) current.overdue += 1;
        if (phase.status === "in_review") current.review += 1;
        rows.set(phase.assignedTo, current);
      });
  });
  return [...rows.values()].sort((a, b) => b.overdue - a.overdue || b.pending - a.pending || userName(a.userId).localeCompare(userName(b.userId)));
}

function brandUnassignedPhaseRows(orders) {
  return orders.flatMap((order) =>
    workOrderPhases(order)
      .filter((phase) => isActivePhase(phase) && !phase.assignedTo)
      .map((phase) => ({ order, phase })),
  );
}

function renderBrandDashboardPanel(brand, orders) {
  const activeOrders = orders.filter((order) => order.brandId === brand.id && isOpenWorkOrder(order));
  const loadRows = brandPhaseLoadRows(activeOrders);
  const unassignedRows = brandUnassignedPhaseRows(activeOrders);
  return `
    <div class="brand-dashboard-panel">
      <div class="brand-dashboard-grid">
        <div>
          <strong>Órdenes activas</strong>
          <div class="dashboard-mini-list">
            ${activeOrders.length ? activeOrders.slice(0, 6).map(renderDashboardMiniOrderRow).join("") : `<div class="empty compact-empty">No hay órdenes activas para esta marca.</div>`}
          </div>
        </div>
        <div>
          <strong>Tareas por responsable</strong>
          <div class="brand-load-list">
            ${
              loadRows.length
                ? loadRows
                    .slice(0, 6)
                    .map(
                      (row) => `
                        <div class="brand-load-row">
                          <span>${escapeHtml(userName(row.userId))}</span>
                          <strong>${row.pending} pendientes</strong>
                          <small class="${row.overdue ? "text-red" : ""}">${row.overdue} vencidas / ${row.review} revisión</small>
                        </div>
                      `,
                    )
                    .join("")
                : `<div class="empty compact-empty">Sin fases activas asignadas.</div>`
            }
          </div>
        </div>
      </div>
      <div class="unassigned-phase-list">
        <strong>Fases sin responsable</strong>
        ${
          unassignedRows.length
            ? unassignedRows
                .slice(0, 5)
                .map(
                  ({ order, phase }) => `
                    <button class="dashboard-mini-row" data-action="view-work-order" data-id="${escapeHtml(order.id)}">
                      <span class="status-dot red"></span>
                      <span>
                        <strong>${escapeHtml(order.id)} · ${escapeHtml(phase.title || "Fase")}</strong>
                        <small>${escapeHtml(order.title)} · ${escapeHtml(formatDate(phase.dueDate || order.dueDate))}</small>
                      </span>
                      <span class="badge red">Sin responsable</span>
                    </button>
                  `,
                )
                .join("")
            : `<div class="empty compact-empty">No hay fases sin responsable en esta marca.</div>`
        }
      </div>
    </div>
  `;
}

function renderManagementBrandsDashboard(sourceOrders, sourceBrands) {
  const rows = sourceBrands
    .filter((brand) => brand?.isActive !== false)
    .map((brand) => {
      const brandActiveOrders = sourceOrders.filter((order) => order.brandId === brand.id && isOpenWorkOrder(order));
      const overdue = brandActiveOrders.filter((order) => daysUntil(order.dueDate) < 0).length;
      const review = brandActiveOrders.filter((order) => order.status === "in_review" || workOrderPhases(order).some((phase) => phase.status === "in_review")).length;
      const unassigned = brandUnassignedPhaseRows(brandActiveOrders).length + brandActiveOrders.filter((order) => !orderAssignees(order).length).length;
      return { brand, open: brandActiveOrders.length, overdue, review, unassigned };
    })
    .sort((a, b) => b.overdue - a.overdue || b.review - a.review || b.open - a.open || a.brand.shortName.localeCompare(b.brand.shortName));

  return `
    <section class="panel executive-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">Órdenes por marca</h2>
          <div class="small-muted">Abre una marca para ver sus OTs, tareas por responsable y fases sin asignar.</div>
        </div>
        <button class="button-ghost small" data-module="team">Ver Equipo</button>
      </div>
      <div class="brand-dashboard-list">
        ${
          rows.length
            ? rows
                .map((row) => {
                  const isOpen = state.dashboardBrandOpenId === row.brand.id;
                  return `
                    <article class="brand-dashboard-item ${isOpen ? "active" : ""}">
                      <button class="brand-dashboard-summary" data-dashboard-brand="${escapeHtml(row.brand.id)}" type="button">
                        <span>
                          <strong>${escapeHtml(row.brand.shortName)}</strong>
                          <small>${escapeHtml(getClient(row.brand.clientId)?.name || "Cliente")} · ${escapeHtml(row.brand.abbreviation || "")}</small>
                        </span>
                        <span class="summary-metrics">
                          <span>${row.open} abiertas</span>
                          <span class="${row.overdue ? "text-red" : ""}">${row.overdue} vencidas</span>
                          <span>${row.review} revisión</span>
                          ${row.unassigned ? `<span class="badge red">${row.unassigned} sin responsable</span>` : ""}
                        </span>
                      </button>
                      ${isOpen ? renderBrandDashboardPanel(row.brand, sourceOrders) : ""}
                    </article>
                  `;
                })
                .join("")
            : `<div class="empty compact-empty">No hay marcas visibles en este filtro.</div>`
        }
      </div>
    </section>
  `;
}

function renderDashboardHeader() {
  const canCreate = canCreateWorkOrders();
  const canViewReports = canOpenModule("reports");
  return `
    <section class="dashboard-command">
      <div>
        <span class="eyebrow">Centro de mando</span>
        <h2>Dashboard operativo</h2>
        <p>Resumen de tareas, vencimientos y prioridades del equipo.</p>
      </div>
      <div class="dashboard-command-actions">
        <select class="brand-select js-brand-select" aria-label="Marca o cliente">
          ${renderBrandOptions(state.currentBrandId)}
        </select>
        ${canCreate ? `<button class="button" data-action="open-create-work-order">+ Crear OT</button>` : ""}
        ${canViewReports ? `<button class="button-ghost" data-module="reports">Ver reportes</button>` : ""}
      </div>
    </section>
  `;
}

function renderAttentionAction(order) {
  if (!orderAssignees(order).length) {
    return `<button class="button-ghost small" data-action="edit-work-order" data-id="${escapeHtml(order.id)}">Asignar responsable</button>`;
  }
  if (order.status === "in_review") {
    return `<button class="button-ghost small" data-action="view-work-order" data-id="${escapeHtml(order.id)}">Mover estado</button>`;
  }
  return `<button class="button-ghost small" data-action="send-urgent-alert" data-id="${escapeHtml(order.id)}">Enviar recordatorio</button>`;
}

function renderAttentionCard(order) {
  const brand = getBrand(order.brandId);
  const client = getClient(brand.clientId);
  const urgency = workOrderUrgency(order);
  const showTimingBadge = shouldRenderWorkOrderTimingBadge(order);
  const assigneeNames = orderAssignees(order).map(userName).join(", ") || "Sin responsable";
  return `
    <article class="alert-card">
      <div class="alert-card-main">
        <div class="row between">
          <span class="badge">${escapeHtml(order.id)}</span>
          ${showTimingBadge ? `<span class="badge ${urgency.cls}">${escapeHtml(urgency.label)}</span>` : ""}
        </div>
        <strong>${escapeHtml(order.title)}</strong>
        <span>${escapeHtml(client?.name || "Cliente")} / ${escapeHtml(brand.shortName)} · ${escapeHtml(assigneeNames)}</span>
        <small>${escapeHtml(workOrderStatusLabels[order.status] || order.status)} · ${escapeHtml(formatDate(order.dueDate))}</small>
      </div>
      <div class="alert-card-actions">
        <button class="button small" data-action="view-work-order" data-id="${escapeHtml(order.id)}">Ver OT</button>
        ${renderAttentionAction(order)}
      </div>
    </article>
  `;
}

function renderDashboardWorkloadTable(sourceOrders = dashboardScopedOrders()) {
  const rows = weeklyDigestRows(sourceOrders)
    .map((row) => ({ ...row, loadLevel: loadLevel(row) }))
    .sort((a, b) => b.overdue - a.overdue || b.open - a.open || b.review - a.review || a.user.name.localeCompare(b.user.name));
  const activeRows = rows.filter((row) => row.open || row.overdue || row.review).slice(0, 8);
  const quietCount = rows.filter((row) => !row.open && !row.overdue && !row.review).length;

  return `
    <section class="panel executive-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">Tareas por responsable</h2>
          <div class="small-muted">Personas con tareas activas o atrasos. Los detalles se abren solo cuando los necesitas.</div>
        </div>
        ${quietCount ? `<span class="badge neutral">${quietCount} sin tareas activas</span>` : ""}
      </div>
      <div class="executive-accordion-list">
        ${
          activeRows
            .map((row, index) => {
              const next = row.next;
              return `
                <details class="executive-disclosure" ${index === 0 ? "open" : ""}>
                  <summary>
                    <span class="summary-main">
                      <strong>${escapeHtml(row.user.name)}</strong>
                      <small>${escapeHtml(roleLabels[row.user.role] || row.user.role)}</small>
                    </span>
                    <span class="summary-metrics">
                      <span>${row.open} abiertas</span>
                      <span class="${row.overdue ? "text-red" : ""}">${row.overdue} vencidas</span>
                      <span>${row.review} revisión</span>
                      <span class="badge ${row.loadLevel.cls}">${row.loadLevel.label}</span>
                    </span>
                  </summary>
                  <div class="disclosure-body">
                    <div>
                      <strong>${next ? "Próxima OT" : "Sin pendiente próximo"}</strong>
                      <p class="muted">${next ? `${next.id} / ${next.title} / ${formatDate(next.dueDate)}` : "Esta persona no tiene una OT abierta en este filtro."}</p>
                    </div>
                    <button class="button-ghost small" data-workorder-assignee-filter="${escapeHtml(row.user.id)}">Ver sus OTs</button>
                  </div>
                </details>
              `;
            })
            .join("") || `<div class="empty compact-empty">No hay responsables con tareas activas en este filtro.</div>`
        }
      </div>
    </section>
  `;
}

function renderRiskBrandsTable(sourceOrders = dashboardScopedOrders(), sourceBrands = dashboardScopedBrands()) {
  const rows = riskyBrandRows(sourceOrders, sourceBrands).slice(0, 8);
  return `
    <section class="panel executive-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">Marcas que necesitan seguimiento</h2>
          <div class="small-muted">Solo aparecen marcas con vencidas, revisión, urgencias o falta de responsable.</div>
        </div>
        <button class="button-ghost small" data-module="brands">Ver marcas</button>
      </div>
      <div class="risk-card-list">
        ${
          rows
            .map(
              (row, index) => `
                <details class="executive-disclosure brand-risk-disclosure" ${index === 0 ? "open" : ""}>
                  <summary>
                    <span class="summary-main">
                      <strong>${escapeHtml(row.brand.shortName)}</strong>
                      <small>${escapeHtml(row.client?.name || "Cliente")}</small>
                    </span>
                    <span class="summary-metrics">
                      <span>${row.open} abiertas</span>
                      <span class="${row.overdue ? "text-red" : ""}">${row.overdue} vencidas</span>
                      <span>${row.review} revisión</span>
                      ${row.unassigned ? `<span class="badge red">${row.unassigned} sin responsable</span>` : ""}
                      ${row.urgent ? `<span class="badge amber">${row.urgent} urgentes</span>` : ""}
                    </span>
                  </summary>
                  <div class="disclosure-body">
                    <div>
                      <strong>Responsable principal</strong>
                      <p class="muted">${escapeHtml(row.responsible)}</p>
                    </div>
                    <button class="button-ghost small" data-brand-jump="${escapeHtml(row.brand.id)}">Ver marca</button>
                  </div>
                </details>
              `,
            )
            .join("") || `<div class="empty compact-empty">No hay marcas en riesgo en este filtro.</div>`
        }
      </div>
    </section>
  `;
}

function renderOperationalDashboard() {
  const sourceOrders = dashboardScopedOrders();
  const phaseRows = currentUserPhaseRows(sourceOrders);
  const activeRows = phaseRows.filter((row) => isActivePhase(row.phase));
  const overdueRows = activeRows.filter((row) => row.phase.dueDate && row.dueDays < 0);
  const weekRows = activeRows.filter((row) => row.phase.dueDate && row.dueDays >= 0 && row.dueDays <= 7);
  const reviewRows = activeRows.filter((row) => row.phase.status === "in_review");
  const completedRows = phaseRows
    .filter((row) => row.phase.status === "completed")
    .sort((a, b) => String(b.phase.completedAt || b.phase.updatedAt || "").localeCompare(String(a.phase.completedAt || a.phase.updatedAt || "")));
  const participatingOrders = userParticipatingOrders(sourceOrders);

  return `
    <section class="dashboard-command operational-command">
      <div>
        <span class="eyebrow">Mi trabajo</span>
        <h2>Dashboard personal</h2>
        <p>Lo que tienes pendiente, vencido o por revisar según tus fases asignadas.</p>
      </div>
      <div class="dashboard-command-actions">
        <select class="brand-select js-brand-select" aria-label="Marca o cliente">
          ${renderBrandOptions(state.currentBrandId)}
        </select>
        <button class="button" data-module="work-orders">Ver mis OTs</button>
      </div>
    </section>
    <section class="dashboard-status-line operational-status-line">
      <strong>Tienes ${activeRows.length} fases pendientes, ${overdueRows.length} vencidas y ${weekRows.length} con deadline en los próximos 7 días.</strong>
      <div class="row wrap">
        <button class="button-ghost small" data-module="work-orders">Abrir bandeja de OTs</button>
      </div>
    </section>
    <section class="executive-kpis operational-kpis">
      ${renderKpiCard("Mis fases pendientes", activeRows.length, "Asignadas a ti", "dark")}
      ${renderKpiCard("Vencidas", overdueRows.length, "Necesitan atención", overdueRows.length ? "danger" : "neutral")}
      ${renderKpiCard("Próximos 7 días", weekRows.length, "Para planificar", "warning")}
      ${renderKpiCard("En revisión", reviewRows.length, "Esperando validación", reviewRows.length ? "warning" : "neutral")}
    </section>
    ${renderOperationalPhaseSection(
      "Mis fases pendientes",
      "Ordenadas por el deadline más cercano.",
      activeRows,
      "No tienes fases pendientes",
      { limit: 8, cta: "Ver orden" },
    )}
    <section class="dashboard-executive-grid operational-grid">
      ${renderOperationalPhaseSection(
        "Mis fases vencidas",
        "Fases asignadas a ti que ya pasaron su deadline.",
        overdueRows,
        "No tienes fases vencidas",
        { limit: 5, badgeClass: overdueRows.length ? "red" : "green", emphasis: overdueRows.length ? "overdue" : "" },
      )}
      ${renderOperationalPhaseSection(
        "Para hoy / próximos 7 días",
        "Lo que viene pronto y conviene resolver primero.",
        weekRows,
        "No tienes fases para los próximos 7 días",
        { limit: 5, badgeClass: weekRows.length ? "amber" : "neutral" },
      )}
      ${renderOperationalPhaseSection(
        "En revisión",
        "Fases tuyas que están en revisión.",
        reviewRows,
        "No tienes fases en revisión",
        { limit: 5, badgeClass: reviewRows.length ? "blue" : "neutral" },
      )}
      ${renderOperationalPhaseSection(
        "Terminadas recientemente",
        "Últimas fases que marcaste como terminadas.",
        completedRows,
        "Aún no tienes fases terminadas recientemente",
        { limit: 5, badgeClass: "green" },
      )}
    </section>
    ${renderOperationalOrderSearch(participatingOrders)}
  `;
}

function renderExecutiveDashboard() {
  const sourceOrders = dashboardScopedOrders();
  const sourceBrands = dashboardScopedBrands();
  const { openOrders, overdueOrders, reviewOrders, unassignedOrders } = dashboardSummaryRows(sourceOrders);
  const criticalOrders = criticalWorkOrders(sourceOrders);

  return `
    ${renderDashboardHeader()}
    <section class="dashboard-status-line">
      <strong>Hay ${overdueOrders.length} OTs vencidas, ${unassignedOrders.length} sin responsable y ${reviewOrders.length} en revisión.</strong>
      <div class="row wrap">
        <button class="button-ghost small" data-workorder-quick-filter="critical">Ver críticas</button>
        <button class="button-ghost small" data-workorder-quick-filter="unassigned">Asignar responsables</button>
      </div>
    </section>
    <section class="executive-kpis">
      ${renderDashboardKpiButton("open", "OTs abiertas", openOrders.length, "Trabajo activo", "dark")}
      ${renderDashboardKpiButton("overdue", "Vencidas", overdueOrders.length, "Necesitan acción", overdueOrders.length ? "danger" : "neutral")}
      ${renderDashboardKpiButton("review", "En revisión", reviewOrders.length, "Validación interna", "warning")}
      ${renderDashboardKpiButton("unassigned", "Sin responsable", unassignedOrders.length, "Pendientes de asignar", unassignedOrders.length ? "danger" : "neutral")}
    </section>
    ${renderDashboardKpiDetail(sourceOrders)}
    <section class="panel attention-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">Prioridades de hoy</h2>
          <div class="small-muted">OTs vencidas, urgentes o bloqueadas que necesitan acción.</div>
        </div>
        ${criticalOrders.length > 5 ? `<button class="button-ghost small" data-workorder-quick-filter="critical">Ver todas las OTs críticas</button>` : ""}
      </div>
      <div class="attention-list">
        ${criticalOrders.slice(0, 5).map(renderAttentionCard).join("") || `<div class="empty compact-empty">Sin OTs críticas por ahora.</div>`}
      </div>
    </section>
    ${renderManagementMyOrders(sourceOrders)}
    ${renderManagementBrandsDashboard(sourceOrders, sourceBrands)}
  `;
}

function renderAllBrandsDashboard() {
  return renderExecutiveDashboard();
}

function calendarAccessScope(role = dataState.profile?.role) {
  if (!isSupabaseMode()) return "management";
  const normalizedRole = normalizeRoleKey(role);
  if (normalizedRole === "cliente") return "client";
  return calendarManagementRoles.has(normalizedRole) ? "management" : "operational";
}

function calendarEventFromOrder(order) {
  if (!order?.dueDate) return null;
  const responsibleIds = orderAssignees(order);
  return {
    id: `order:${order.dbId || order.id}`,
    type: "order",
    typeLabel: "OT",
    order,
    orderId: order.id,
    code: order.id,
    title: order.title,
    brandId: order.brandId,
    date: order.dueDate,
    status: order.status,
    statusLabel: workOrderStatusLabels[order.status] || order.status || "Sin estado",
    responsibleIds,
  };
}

function calendarEventFromPhase(order, phase) {
  if (!phase?.dueDate || !phase.assignedTo) return null;
  return {
    id: `phase:${phase.id}`,
    type: "phase",
    typeLabel: "Fase",
    order,
    orderId: order.id,
    code: order.id,
    title: phase.title || workOrderPhaseTitle(phase.phaseKey),
    brandId: order.brandId,
    date: phase.dueDate,
    status: phase.status,
    statusLabel: phaseStatusLabel(phase.status),
    responsibleIds: [phase.assignedTo],
  };
}

function calendarEventsForCurrentScope() {
  const sourceOrders = brandOrders();
  const scope = calendarAccessScope();
  if (scope !== "operational") {
    return sourceOrders.map(calendarEventFromOrder).filter(Boolean);
  }

  const currentUserId = currentProfileId();
  if (!currentUserId) return [];

  return sourceOrders
    .flatMap((order) => {
      const events = [];
      if (orderAssignees(order).includes(currentUserId)) {
        const orderEvent = calendarEventFromOrder(order);
        if (orderEvent) events.push(orderEvent);
      }
      workOrderPhases(order).forEach((phase) => {
        if (phase.assignedTo !== currentUserId) return;
        const phaseEvent = calendarEventFromPhase(order, phase);
        if (phaseEvent) events.push(phaseEvent);
      });
      return events;
    })
    .sort((left, right) =>
      String(left.date || "").localeCompare(String(right.date || ""))
      || left.type.localeCompare(right.type)
      || String(left.code || "").localeCompare(String(right.code || "")),
    );
}

function calendarEventVisual(event) {
  if (event.type === "order") return workOrderUrgency(event.order);
  if (["blocked", "changes_requested", "cancelled"].includes(event.status)) return { cls: "red", label: event.statusLabel };
  if (event.status === "completed") return { cls: "green", label: event.statusLabel };
  if (event.status === "in_review") return { cls: "amber", label: event.statusLabel };
  return { cls: "blue", label: event.statusLabel };
}

function calendarEventResponsibleLabel(event) {
  return event.responsibleIds.map(userName).filter(Boolean).join(", ") || "Sin asignar";
}

function isOpenCalendarEvent(event) {
  if (event.type === "order") return isOpenWorkOrder(event.order);
  return !isArchivedWorkOrder(event.order) && !["completed", "cancelled"].includes(event.status);
}

function calendarEventCountLabel(count) {
  if (calendarAccessScope() === "operational") {
    return `${count} elemento${count === 1 ? "" : "s"}`;
  }
  return `${count} OT${count === 1 ? "" : "s"}`;
}

function renderDashboardDeadlineCalendar(sourceEvents, title = "Calendario mensual de deadlines", scopeLabel = "") {
  const monthKey = state.dashboardMonth || monthKeyFromDate();
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sab", "Dom"];
  const cells = monthCalendarDays(monthKey);
  const monthEvents = sourceEvents
    .filter((event) => dateMatchesMonth(event.date, monthKey))
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  const openMonthEvents = monthEvents.filter(isOpenCalendarEvent);
  const overdueMonthEvents = openMonthEvents.filter((event) => daysUntil(event.date) < 0);

  return `
    <section class="panel section dashboard-calendar-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">${title}</h2>
          <div class="small-muted">${scopeLabel || "Elementos"} con fecha en el mes seleccionado.</div>
        </div>
        <div class="row wrap">
          <input class="input month-input" type="month" data-dashboard-month value="${escapeHtml(monthKey)}" />
          <span class="badge blue">${calendarEventCountLabel(monthEvents.length)}</span>
          <span class="badge ${overdueMonthEvents.length ? "red" : "green"}">${overdueMonthEvents.length} vencido${overdueMonthEvents.length === 1 ? "" : "s"}</span>
        </div>
      </div>
      <div class="deadline-calendar-grid">
        ${days.map((day) => `<div class="deadline-calendar-head">${day}</div>`).join("")}
        ${cells
          .map((cell) => {
            const dayEvents = monthEvents.filter((event) => String(event.date || "").slice(0, 10) === cell.iso);
            return `
              <div class="deadline-calendar-day ${cell.isCurrentMonth ? "" : "muted-month"} ${cell.isToday ? "today" : ""}">
                <div class="deadline-day-number">
                  <span>${cell.day}</span>
                  ${dayEvents.length ? `<strong>${dayEvents.length}</strong>` : ""}
                </div>
                <div class="deadline-day-items">
                  ${dayEvents
                    .slice(0, 4)
                    .map((event) => {
                      const visual = calendarEventVisual(event);
                      const brand = getBrand(event.brandId);
                      return `
                        <button class="deadline-chip ${visual.cls}" data-action="view-work-order" data-id="${escapeHtml(event.orderId)}">
                          <strong>${escapeHtml(event.code)} · ${escapeHtml(event.typeLabel)}</strong>
                          <span>${escapeHtml(event.title)}</span>
                          <small>${escapeHtml(isAllBrandsScope() ? `${brand.shortName} · ${calendarEventResponsibleLabel(event)}` : calendarEventResponsibleLabel(event))}</small>
                        </button>
                      `;
                    })
                    .join("")}
                  ${dayEvents.length > 4 ? `<span class="deadline-more">+${dayEvents.length - 4} más</span>` : ""}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function weekDaysFromToday() {
  const today = todayAtNoon();
  const dayIndex = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayIndex);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      label: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][index],
      iso: isoDateFromDate(date),
      day: date.getDate(),
      isToday: isoDateFromDate(date) === isoDateFromDate(today),
    };
  });
}

function renderWeeklyDeadlineCalendar(sourceEvents) {
  const days = weekDaysFromToday();
  const weekEventCount = sourceEvents.filter((event) => days.some((day) => day.iso === String(event.date || "").slice(0, 10))).length;
  const personalCalendar = calendarAccessScope() === "operational";
  return `
    <section class="panel section dashboard-calendar-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">Semana de deadlines</h2>
          <div class="small-muted">${personalCalendar ? "Vista rápida de lunes a domingo con tus elementos del periodo." : "Vista rápida de lunes a domingo con las OTs del periodo."}</div>
        </div>
        <span class="badge blue">${calendarEventCountLabel(weekEventCount)}</span>
      </div>
      <div class="deadline-week-grid">
        ${days
          .map((day) => {
            const dayEvents = sourceEvents.filter((event) => String(event.date || "").slice(0, 10) === day.iso);
            return `
              <article class="deadline-week-day ${day.isToday ? "today" : ""}">
                <div class="deadline-week-head">
                  <strong>${day.label}</strong>
                  <span>${day.day}</span>
                </div>
                <div class="deadline-week-items">
                  ${
                    dayEvents.length
                      ? dayEvents
                          .slice(0, 6)
                          .map((event) => {
                            const visual = calendarEventVisual(event);
                            return `
                              <button class="deadline-week-item ${visual.cls}" data-action="view-work-order" data-id="${escapeHtml(event.orderId)}">
                                <strong>${escapeHtml(event.code)} · ${escapeHtml(event.typeLabel)}</strong>
                                <span>${escapeHtml(event.title)} · ${escapeHtml(calendarEventResponsibleLabel(event))}</span>
                              </button>
                            `;
                          })
                          .join("")
                      : `<span class="muted">Sin elementos</span>`
                  }
                  ${dayEvents.length > 6 ? `<span class="deadline-more">+${dayEvents.length - 6} más</span>` : ""}
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderCalendarListEvent(event) {
  const visual = calendarEventVisual(event);
  const brand = getBrand(event.brandId);
  return `
    <article class="operation-order-row compact-order-row calendar-event-row">
      <button class="operation-order-main compact-order-main" data-action="view-work-order" data-id="${escapeHtml(event.orderId)}">
        <span class="status-dot ${visual.cls}"></span>
        <span>
          <strong>${escapeHtml(event.code)} · ${escapeHtml(event.typeLabel)}</strong>
          <small>${escapeHtml(event.title)}</small>
          <em>${escapeHtml(brand.shortName)} · ${escapeHtml(calendarEventResponsibleLabel(event))}</em>
        </span>
      </button>
      <div class="operation-meta">
        <span class="badge ${visual.cls}">${escapeHtml(event.statusLabel)}</span>
        <span class="muted">${escapeHtml(formatDate(event.date))}</span>
      </div>
      <div class="operation-status-control">
        <button class="button-ghost small" data-action="view-work-order" data-id="${escapeHtml(event.orderId)}">Ver OT</button>
      </div>
    </article>
  `;
}

function renderDeadlineList(sourceEvents) {
  const ordered = sourceEvents
    .slice()
    .filter((event) => event.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const grouped = ordered.reduce((acc, event) => {
    const key = String(event.date || "").slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});
  const days = Object.keys(grouped);
  const personalCalendar = calendarAccessScope() === "operational";
  return `
    <section class="panel section dashboard-calendar-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">Lista por fecha</h2>
          <div class="small-muted">${personalCalendar ? "Tus OTs y fases agrupadas por día para revisar sin calendario visual." : "OTs agrupadas por día para revisar sin calendario visual."}</div>
        </div>
        <span class="badge blue">${calendarEventCountLabel(ordered.length)}</span>
      </div>
      <div class="deadline-list">
        ${
          days.length
            ? days
                .map(
                  (day) => `
                    <details class="deadline-list-group" ${days.indexOf(day) === 0 ? "open" : ""}>
                      <summary>
                        <strong>${escapeHtml(formatDate(day))}</strong>
                        <span>${calendarEventCountLabel(grouped[day].length)}</span>
                      </summary>
                      <div class="deadline-list-items">
                        ${grouped[day].map(renderCalendarListEvent).join("")}
                      </div>
                    </details>
                  `,
                )
                .join("")
            : `<div class="empty compact-empty">Sin deadlines registrados.</div>`
        }
      </div>
    </section>
  `;
}

function renderCalendarWorkspace() {
  const events = calendarEventsForCurrentScope();
  const calendarView = state.calendarView || "month";
  const canCreate = canCreateWorkOrders();
  const personalCalendar = calendarAccessScope() === "operational";
  return `
    <section class="section">
      <section class="panel brand-hero calendar-hero">
        <div>
          <div class="hero-title">
            <h2>Calendario</h2>
            <span class="badge blue">${personalCalendar ? "Mi calendario" : isAllBrandsScope() ? "Vista global" : getBrand().shortName}</span>
          </div>
          <p class="muted">${personalCalendar ? "Tus OTs asignadas y fases propias, sin elementos de otros responsables." : "Fechas de entrega y agenda mensual de OTs sin saturar el Dashboard ejecutivo."}</p>
        </div>
        <div class="quick-links">
          ${canCreate ? `<button class="button" data-action="open-create-work-order">+ Crear OT</button>` : ""}
          <button class="button-ghost" data-module="work-orders">Ver lista de OTs</button>
        </div>
      </section>
      <div class="segmented calendar-tabs" aria-label="Vistas de calendario">
        <button class="${calendarView === "month" ? "active" : ""}" type="button" data-calendar-view="month">Mes</button>
        <button class="${calendarView === "week" ? "active" : ""}" type="button" data-calendar-view="week">Semana</button>
        <button class="${calendarView === "list" ? "active" : ""}" type="button" data-calendar-view="list">Lista</button>
      </div>
      ${
        calendarView === "week"
          ? renderWeeklyDeadlineCalendar(events)
          : calendarView === "list"
            ? renderDeadlineList(events)
            : renderDashboardDeadlineCalendar(
                events,
                personalCalendar ? "Mi calendario mensual" : "Calendario mensual de deadlines",
                personalCalendar ? "Tus OTs y fases" : isAllBrandsScope() ? "OTs de todas las marcas" : getBrand().shortName,
              )
      }
      ${calendarView === "month" ? renderWorkOrderMonthTimeline(events.filter(isOpenCalendarEvent)) : ""}
    </section>
  `;
}

function renderBrandsWorkspace() {
  const snapshots = brands.map(getBrandSnapshot);
  const canCreateBrand = canCreateBrands();
  return `
    <section class="section">
      <section class="panel brand-hero brands-hero">
        <div>
          <div class="hero-title">
            <h2>Marcas</h2>
            <span class="badge blue">${clients.length} clientes</span>
          </div>
          <p class="muted">Navega por cliente y marca. El Dashboard solo muestra las marcas que necesitan seguimiento.</p>
        </div>
        <div class="quick-links">
          ${canCreateBrand ? `<button class="button" data-action="open-create-brand">+ Nueva marca</button>` : ""}
          <button class="button" data-action="open-create-work-order">+ Crear OT</button>
          <button class="button-ghost" data-module="dashboard">Volver al dashboard</button>
        </div>
      </section>
      <div class="client-lanes brands-client-lanes">
        ${brandCollectionGroups()
          .map((group) => {
            const clientSnapshots = snapshots.filter((snapshot) =>
              group.brands.some((brand) => brand.id === snapshot.brand.id),
            );
            const clientOpen = clientSnapshots.reduce((sum, snapshot) => sum + snapshot.open, 0);
            const clientOverdue = clientSnapshots.reduce((sum, snapshot) => sum + snapshot.overdue, 0);
            const clientReview = clientSnapshots.reduce((sum, snapshot) => sum + snapshot.review, 0);
            return `
              <article class="client-lane navigation-card">
                <div class="client-lane-head">
                  <div>
                    <strong>${escapeHtml(group.label)}</strong>
                    <span>${clientSnapshots.length} marcas / ${clientOpen} OTs abiertas</span>
                  </div>
                  <div class="badge-row">
                    <span class="badge ${clientOverdue ? "red" : "neutral"}">${clientOverdue} vencidas</span>
                    <span class="badge ${clientReview ? "amber" : "neutral"}">${clientReview} revisión</span>
                  </div>
                </div>
                <div class="brand-mini-grid">
                  ${clientSnapshots.map(renderAllBrandCard).join("")}
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
      ${renderCreateBrandModal()}
    </section>
  `;
}

function renderCreateBrandModal() {
  if (!state.creatingBrand || !canCreateBrands()) return "";
  return `
    <div class="modal-backdrop" data-action="close-create-brand" aria-hidden="true"></div>
    <aside class="modal-panel" role="dialog" aria-modal="true" aria-label="Crear marca">
      <button class="modal-close-button" type="button" data-action="close-create-brand" aria-label="Cerrar">×</button>
      <div class="panel section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Nueva marca</h2>
            <div class="small-muted">La marca activa quedará disponible inmediatamente según los permisos de Supabase.</div>
          </div>
          <span class="badge green">Activa</span>
        </div>
        <div class="form-grid">
          <div class="field full">
            <label>Nombre</label>
            <input class="input" id="new-brand-name" autocomplete="off" placeholder="Nombre de la marca" />
          </div>
          <div class="field">
            <label>Código de órdenes</label>
            <input class="input" id="new-brand-code" autocomplete="off" maxlength="4" placeholder="ABC" />
            <div class="field-help">Se usará para códigos como ABC-001.</div>
          </div>
          <div class="field">
            <label>Cliente</label>
            <select class="input" id="new-brand-client">
              <option value="">Seleccionar cliente</option>
              ${clients.map((client) => `<option value="${escapeHtml(client.id)}">${escapeHtml(client.name)}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="row wrap form-actions">
          <button class="button" type="button" data-action="save-brand" ${state.brandSubmitting ? "disabled aria-busy=\"true\"" : ""}>
            ${state.brandSubmitting ? "Creando..." : "Crear marca"}
          </button>
          <button class="button-ghost" type="button" data-action="close-create-brand" ${state.brandSubmitting ? "disabled" : ""}>Cancelar</button>
        </div>
      </div>
    </aside>
  `;
}

function renderDashboard() {
  if (usesCreatedOrdersDashboard()) return renderPriorityCreatedOrdersDashboard();
  return isManagementDashboardRole() ? renderExecutiveDashboard() : renderOperationalDashboard();
}

function renderMetric(label, value, detail) {
  const lowerLabel = label.toLowerCase();
  const normalizedLabel = lowerLabel.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const iconKey = normalizedLabel.includes("venc")
    ? "alert"
    : normalizedLabel.includes("revision")
      ? "time"
      : normalizedLabel.includes("email") || normalizedLabel.includes("notific")
        ? "notifications"
        : normalizedLabel.includes("usuario") || normalizedLabel.includes("responsable") || normalizedLabel.includes("destinatario")
          ? "team"
          : normalizedLabel.includes("marca") || normalizedLabel.includes("cliente")
            ? "brand"
            : normalizedLabel.includes("archiv")
              ? "archive"
              : "work-orders";
  return `
    <div class="metric">
      <div class="metric-label">${iconSvg(iconKey)}<span>${label}</span></div>
      <div class="metric-value">${value}</div>
      <div class="metric-detail">${detail}</div>
    </div>
  `;
}

function renderWeeklyDigestPreview() {
  const rows = weeklyDigestRows();
  return `
    <div class="email-preview compact-digest">
      <div class="email-preview-header">
        <strong>${weeklyDigestConfig.subject}</strong>
        <span>${weeklyDigestConfig.day} ${weeklyDigestConfig.time}</span>
      </div>
      <div class="digest-list">
        ${
          rows.length
            ? rows
                .map(
                  ({ user, open, overdue, review, collaborators, next }) => `
                    <div class="digest-row">
                      <div>
                        <strong>${escapeHtml(user?.name || "Sin responsable")}</strong>
                        <div class="muted">${escapeHtml(roleLabels[user?.role] || user?.role || "Usuario interno")}</div>
                      </div>
                      <div class="digest-stats">
                        <span class="badge ${overdue > 0 ? "red" : "green"}">${overdue} vencidas</span>
                        <span class="badge blue">${open} abiertas</span>
                        <span class="badge amber">${review} rev.</span>
                        <span class="badge purple">${collaborators} colab.</span>
                      </div>
                      <div class="digest-next">
                        ${
                          next
                            ? `${escapeHtml(next.id || next.code || next.title || "Sin título")} / ${next.dueDate ? formatDate(next.dueDate) : "Sin fecha"}`
                            : "Sin pendientes"
                        }
                      </div>
                    </div>
                  `,
                )
                .join("")
            : `<div class="empty compact-empty">Sin actividad esta semana.</div>`
        }
      </div>
    </div>
  `;
}

function renderWeeklyDigestMini() {
  const rows = weeklyDigestRows();
  const open = rows.reduce((sum, row) => sum + row.open, 0);
  const overdue = rows.reduce((sum, row) => sum + row.overdue, 0);
  const review = rows.reduce((sum, row) => sum + row.review, 0);
  const activeRecipients = rows.filter((row) => row.open || row.overdue || row.review || row.next).length;

  return `
    <div class="digest-mini">
      <div class="digest-mini-copy">
        <strong>${weeklyDigestConfig.day} ${weeklyDigestConfig.time}</strong>
        <span>Resumen por correo para Dirección/Cuentas con las tareas pendientes del equipo.</span>
      </div>
      <div class="digest-mini-metrics">
        <span><strong>${open}</strong> abiertas</span>
        <span><strong>${overdue}</strong> vencidas</span>
        <span><strong>${review}</strong> en revisión</span>
        <span><strong>${activeRecipients}</strong> con pendientes</span>
      </div>
      <div class="row wrap">
        <button class="button-ghost small" data-module="notifications">Configurar emails</button>
        <button class="button small" data-action="run-weekly-digest-now">Enviar ahora</button>
      </div>
    </div>
  `;
}

function renderWorkOrderBrandShortcut(brand) {
  const snapshot = getBrandSnapshot(brand);
  return `
    <button class="brand-shortcut" data-brand-jump="${brand.id}">
      <strong>${escapeHtml(brand.shortName)}</strong>
      <span>${snapshot.open} abiertas / ${snapshot.overdue} vencidas</span>
    </button>
  `;
}

function renderWorkOrderSetupSection(allBrands) {
  if (!allBrands) {
    return `
      <section class="work-order-form-band">
        ${renderWorkOrderForm(selectedEditingOrder())}
      </section>
    `;
  }

  return `
    <section class="work-order-action-band single compact-brand-selection brand-selection-wide">
      <div class="panel section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Crear OT por marca</h2>
            <div class="small-muted">Selecciona una marca para abrir su workspace y crear la orden desde ahi.</div>
          </div>
          <span class="badge amber">Requiere marca</span>
        </div>
        <div class="brand-shortcut-grid">
          ${brands.map(renderWorkOrderBrandShortcut).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderCreateWorkOrderModal(allBrands) {
  if (!state.creatingWorkOrder || !canCreateWorkOrders()) return "";
  return `
    <div class="modal-backdrop" data-action="close-create-work-order" aria-hidden="true"></div>
    <aside class="modal-panel work-order-create-modal" role="dialog" aria-modal="true" aria-label="Crear orden de trabajo">
      <button class="modal-close-button" type="button" data-action="close-create-work-order" aria-label="Cerrar">×</button>
      ${renderWorkOrderSetupSection(allBrands)}
    </aside>
  `;
}

function renderWorkOrderSmartPanel(orders, allBrands) {
  const urgentOrders = orders
    .filter((order) => isOpenWorkOrder(order) && (isUrgentWorkOrder(order) || daysUntil(workOrderEffectiveDueDate(order)) <= 1))
    .sort((a, b) => daysUntil(workOrderEffectiveDueDate(a)) - daysUntil(workOrderEffectiveDueDate(b)))
    .slice(0, 4);
  const smartBrand = allBrands ? "" : getBrand().shortName;

  return `
    <section class="smart-work-order-panel">
      ${
        ENABLE_AI_ASSISTANT
          ? `
            ${renderWorkOrderAiComposer(allBrands)}
            <article class="smart-card ai-smart-card">
              <div class="smart-icon">${iconSvg("ai")}</div>
              <div>
                <span class="eyebrow">Asistente activo</span>
                <h2>Crear OT más rápido</h2>
                <p>${allBrands ? "Selecciona una marca y el formulario abrirá el asistente para convertir una solicitud en título, categoría, subtareas y responsables." : `Lista para crear o editar órdenes de ${escapeHtml(smartBrand)}.`}</p>
              </div>
              <button class="button small" data-action="focus-work-order-ai">${allBrands ? "Elegir marca" : "Usar IA"}</button>
            </article>
          `
          : ""
      }
      <article class="smart-card urgent-smart-card">
        <div class="smart-icon alert-icon">${iconSvg("alert")}</div>
        <div>
          <span class="eyebrow">Alertas</span>
          <h2>${urgentOrders.length} urgentes</h2>
          <p>Órdenes vencidas, de alta prioridad o con deadline inmediato aparecen aquí para accionar rápido.</p>
        </div>
        <button class="button-danger small" data-action="focus-urgent-orders">Ver alertas</button>
      </article>
      <article class="smart-card time-smart-card">
        <div class="smart-icon">${iconSvg("time")}</div>
        <div>
          <span class="eyebrow">Medicion</span>
          <h2>Tiempo promedio por etapa</h2>
          <p>Mide cuánto tarda una OT en pasar de En proceso a Entregada por rol y área.</p>
        </div>
        <button class="button-ghost small" data-module="reports">Ver reportería</button>
      </article>
      <div class="urgent-inline-panel" data-urgent-orders-panel>
        <div class="section-header compact">
          <div>
            <h3 class="section-title">Alertas urgentes visibles</h3>
            <div class="small-muted">Acciones directas para jefes, cuentas y responsables.</div>
          </div>
          <span class="badge ${urgentOrders.length ? "red" : "green"}">${urgentOrders.length ? "Revisar" : "Sin urgencias"}</span>
        </div>
        <div class="urgent-inline-list">
          ${
            urgentOrders.length
              ? urgentOrders
                  .map((order) => {
                    const brand = getBrand(order.brandId);
                    const urgency = workOrderUrgency(order);
                    return `
                      <div class="urgent-inline-row">
                        <button class="urgent-inline-main" data-action="view-work-order" data-id="${escapeHtml(order.id)}">
                          <strong>${escapeHtml(order.id)}</strong>
                          <span>${escapeHtml(order.title)}</span>
                          <small>${escapeHtml(getClient(brand.clientId)?.name || "Cliente")} / ${escapeHtml(brand.shortName)} / ${escapeHtml(urgency.label)}</small>
                        </button>
                        <div class="row wrap">
                          <button class="button-ghost small" data-action="view-work-order" data-id="${escapeHtml(order.id)}">Ver</button>
                          ${canManageWorkOrders() ? `<button class="button-danger small" data-action="send-urgent-alert" data-id="${escapeHtml(order.id)}">Enviar alerta</button>` : ""}
                        </div>
                      </div>
                    `;
                  })
                  .join("")
              : `<div class="empty compact-empty">No hay OTs urgentes en este scope.</div>`
          }
        </div>
      </div>
    </section>
  `;
}

function renderWorkOrderAiComposer(allBrands) {
  const brandSelectOptions = `
    <option value="">Detectar por texto</option>
    ${brandCollectionGroups()
      .map(
        (group) => `
          <optgroup label="${escapeHtml(group.label)}">
            ${group.brands
              .map(
                (brandItem) => `
                  <option value="${escapeHtml(brandItem.id)}" ${!allBrands && brandItem.id === state.currentBrandId ? "selected" : ""}>
                    ${escapeHtml(brandItem.shortName)}
                  </option>
                `,
              )
              .join("")}
          </optgroup>
        `,
      )
      .join("")}
  `;

  return `
    <article class="ai-composer-panel">
      <div class="ai-composer-head">
        <div class="smart-icon">${iconSvg("ai")}</div>
        <div>
          <span class="eyebrow">Crear OT más rápido</span>
          <h2>Crear OT con ayuda de IA</h2>
          <p class="muted">Escribe lo que necesitas y el sistema completa título, marca, entregables, responsable, fecha y prioridad.</p>
        </div>
      </div>
      <div class="ai-composer-grid">
        <div class="field full">
          <label>Solicitud</label>
          <textarea class="textarea" id="ai-order-brief" placeholder="Ej: Necesito una matriz de contenido de julio para Silk. Que la trabaje generador y creativo, incluir reels, carruseles y copies. Entrega el 25/05/2026. Es urgente."></textarea>
        </div>
        <div class="field">
          <label>Marca</label>
          <select class="input" id="ai-order-brand">${brandSelectOptions}</select>
        </div>
        <div class="field">
          <label>Para quien / rol</label>
          <input class="input" id="ai-order-target" placeholder="Ej: Raquel, diseño, edición, cuentas" />
        </div>
        <div class="ai-composer-actions">
          <button class="button" data-action="draft-work-order-ai">Crear borrador de OT</button>
          <span class="small-muted">No guarda nada hasta que revises y presiones Crear OT.</span>
        </div>
      </div>
    </article>
  `;
}

function renderWorkOrderMonthTimeline(events) {
  const monthKey = state.workOrderMonth || monthKeyFromDate();
  const monthEvents = events
    .filter((event) => dateMatchesMonth(event.date, monthKey))
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  const grouped = monthEvents.reduce((acc, event) => {
    const day = String(event.date || "").slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {});
  const days = Object.keys(grouped).sort();
  const personalCalendar = calendarAccessScope() === "operational";

  return `
    <section class="panel section work-order-timetable">
      <div class="section-header">
        <div>
          <h2 class="section-title">Timetable del mes</h2>
          <div class="small-muted">${personalCalendar ? "Tus elementos pendientes con fecha dentro del mes seleccionado." : "OTs pendientes con fecha dentro del mes seleccionado."}</div>
        </div>
        <div class="row wrap">
          <input class="input month-input" type="month" data-work-order-month value="${escapeHtml(monthKey)}" />
          <span class="badge blue">${calendarEventCountLabel(monthEvents.length)}</span>
        </div>
      </div>
      <div class="timeline-strip">
        ${
          days.length
            ? days
                .map(
                  (day) => `
                    <div class="timeline-day">
                      <div class="timeline-date">
                        <strong>${escapeHtml(formatDate(day))}</strong>
                        <span>${grouped[day].length} pendiente${grouped[day].length === 1 ? "" : "s"}</span>
                      </div>
                      <div class="timeline-items">
                        ${grouped[day]
                          .map(
                            (event) => `
                              <button class="timeline-item" data-action="view-work-order" data-id="${escapeHtml(event.orderId)}">
                                <span>${escapeHtml(event.code)} · ${escapeHtml(event.typeLabel)}</span>
                                <strong>${escapeHtml(event.title)}</strong>
                                <small>${escapeHtml(calendarEventResponsibleLabel(event))} · ${escapeHtml(event.statusLabel)}</small>
                              </button>
                            `,
                          )
                          .join("")}
                      </div>
                    </div>
                  `,
                )
                .join("")
            : `<div class="empty compact-empty">Sin deadlines en este mes</div>`
        }
      </div>
    </section>
  `;
}

function renderBrandPickerPrompt(title, detail) {
  const snapshots = brands.map(getBrandSnapshot);
  return `
    ${renderAllBrandsHero()}
    <section class="panel section">
      <div class="section-header">
        <div>
          <h2 class="section-title">${title}</h2>
          <div class="small-muted">${detail}</div>
        </div>
        <span class="badge blue">Selecciona marca</span>
      </div>
      <div class="brand-health-grid">
        ${snapshots.map(renderAllBrandCard).join("")}
      </div>
    </section>
  `;
}

function renderBrandConfig() {
  if (isAllBrandsScope()) {
    return renderBrandPickerPrompt(
      "Elige una marca para configurarla",
      "La configuracion fundacional vive por marca para que IA, Canva, contenido y reportes no mezclen contexto.",
    );
  }
  const brand = getBrand();
  const config = getBrandConfig(brand.id);
  const activeSection =
    brandConfigSections.find((section) => section.key === state.brandConfigSection) || brandConfigSections[0];
  const channels = brandChannels.filter((channel) => channel.brandId === brand.id);
  const audit = brandAuditLog.filter((event) => event.brandId === brand.id);
  const completion = overallConfigCompletion(config);
  return `
    <section class="config-layout">
      <div class="section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Configuracion fundacional de marca</h2>
            <div class="small-muted">Fuente de verdad para operar ${brand.name}</div>
          </div>
          <div class="row wrap">
            <span class="badge green">Auto-save activo</span>
            <span class="badge blue">${completion}% completo</span>
          </div>
        </div>
        <div class="config-editor">
          <aside class="config-tabs">
            ${brandConfigSections
              .map((section) => {
                const score = sectionCompletion(config, section);
                return `
                  <button class="config-tab ${section.key === activeSection.key ? "active" : ""}" data-config-section="${section.key}">
                    <span>
                      <strong>${section.title}</strong>
                      <small>${score}% completo</small>
                    </span>
                    <div class="mini-progress"><div style="width:${score}%"></div></div>
                  </button>
                `;
              })
              .join("")}
          </aside>
          <div class="panel section config-form-panel">
            <div class="section-header">
              <div>
                <h3 class="section-title">${activeSection.title}</h3>
                <div class="small-muted">${activeSection.description}</div>
              </div>
              <span class="badge ${sectionCompletion(config, activeSection) >= 80 ? "green" : "amber"}">
                ${sectionCompletion(config, activeSection)}%
              </span>
            </div>
            <div class="form-grid">
              ${activeSection.fields
                .map(([fieldKey, type, label, helper]) => {
                  const value = config[activeSection.key]?.[fieldKey] || "";
                  const control =
                    type === "textarea"
                      ? `<textarea class="textarea" data-config-field="${fieldKey}" data-config-section-key="${activeSection.key}">${escapeHtml(value)}</textarea>`
                      : `<input class="input" data-config-field="${fieldKey}" data-config-section-key="${activeSection.key}" value="${escapeHtml(value)}" />`;
                  return `
                    <div class="field ${type === "textarea" ? "full" : ""}">
                      <label>${label}</label>
                      ${control}
                      <div class="field-help">${helper}</div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
        </div>
        <div class="grid grid-2">
          <div class="panel section">
            <div class="section-header">
              <h2 class="section-title">Canales conectados</h2>
              <button class="button-ghost small">Agregar canal</button>
            </div>
            <div class="stack">
              ${
                channels
                  .map(
                    (channel) => `
                      <div class="mini-card">
                        <div class="row between">
                          <strong>${channel.channel}</strong>
                          <span class="badge green">${channel.status}</span>
                        </div>
                        <span class="muted">${channel.handle} / ${channel.objective}</span>
                      </div>
                    `,
                  )
                  .join("") || `<div class="empty">Sin canales configurados</div>`
              }
            </div>
          </div>
          <div class="panel section">
            <h2 class="section-title">Gemini config</h2>
            <div class="form-grid">
              <div class="field">
                <label>Modelo</label>
                <input class="input" data-config-field="geminiModel" data-config-section-key="voice" value="${escapeHtml(config.voice?.geminiModel || "gemini-1.5-pro")}" />
              </div>
              <div class="field">
                <label>Temperatura</label>
                <input class="input" data-config-field="temperature" data-config-section-key="voice" value="${escapeHtml(config.voice?.temperature || "0.7")}" />
              </div>
              <div class="field full">
                <label>System prompt por marca</label>
                <textarea class="textarea" data-config-field="systemPrompt" data-config-section-key="voice">${escapeHtml(config.voice?.systemPrompt || "")}</textarea>
              </div>
            </div>
          </div>
        </div>
        <div class="panel section">
          <h2 class="section-title">Bitacora de marca</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Accion</th><th>Usuario</th><th>Fecha</th></tr>
              </thead>
              <tbody>
                ${
                  audit
                    .map(
                      (event) => `
                        <tr>
                          <td>${event.action}</td>
                          <td>${event.actor}</td>
                          <td>${event.date}</td>
                        </tr>
                      `,
                    )
                    .join("") || `<tr><td colspan="3">Sin eventos todavia</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <aside class="panel autosave-rail">
        <h2 class="section-title">Como se usa</h2>
        <p class="muted">Esta pantalla alimenta todos los demás módulos: IA, contenido, reportería, aprobaciones y portal cliente.</p>
        <div class="config-score">
          <strong>${completion}%</strong>
          <span>madurez de configuracion</span>
          <div class="bar-track"><div class="bar-fill" style="width:${completion}%"></div></div>
        </div>
        <div class="stack">
          <div class="mini-card"><strong>1. Completa marca</strong><span class="muted">Identidad, canales y servicios.</span></div>
          <div class="mini-card"><strong>2. Define IA</strong><span class="muted">Gemini usa estas reglas al crear ideas y copies.</span></div>
          <div class="mini-card"><strong>3. Audita cambios</strong><span class="muted">Cada cambio importante queda en brand_audit_log.</span></div>
        </div>
        <div class="divider"></div>
        <div class="stack">
          <button class="button" data-action="use-config-content">Usar en contenido</button>
          <button class="button-ghost" data-action="use-config-ai">Probar IA con esta marca</button>
          <button class="button-ghost" data-action="export-brand-config">Exportar resumen</button>
        </div>
      </aside>
    </section>
  `;
}

function selectedEditingOrder() {
  return findWorkOrderByAnyId(state.editingWorkOrderId);
}

function selectedViewingOrder() {
  return findWorkOrderByAnyId(state.viewingWorkOrderId);
}

function findWorkOrderByAnyId(id) {
  if (!id) return null;
  return workOrders.find((order) => order.id === id || order.dbId === id) || null;
}

function renderWorkOrderSelectOption(value, label, activeValue) {
  return `<option value="${value}" ${value === activeValue ? "selected" : ""}>${label}</option>`;
}

function renderPhaseKeyOptions(activeKey = "custom") {
  const options = [
    ...workOrderPhaseCatalog.map((phase) => [phase.key, phase.title]),
    ["custom", "Personalizada"],
  ];
  return options.map(([value, label]) => renderWorkOrderSelectOption(value, label, activeKey)).join("");
}

function renderPhaseStatusOptions(activeStatus = "pending") {
  return Object.entries(workOrderPhaseStatusLabels)
    .map(([value, label]) => renderWorkOrderSelectOption(value, label, activeStatus))
    .join("");
}

function renderPhaseAssigneeOptions(activeUserId = "") {
  const availableUsers = availableWorkOrderAssigneeUsers(new Set(activeUserId ? [activeUserId] : []));
  const hasActiveUserOption = !activeUserId || availableUsers.some((user) => user.id === activeUserId);
  return `
    <option value="">Sin responsable</option>
    ${
      activeUserId && !hasActiveUserOption
        ? `<option value="${escapeHtml(activeUserId)}" selected>${escapeHtml(phaseAssigneeLabel(activeUserId))}</option>`
        : ""
    }
    ${availableUsers
      .map((user) => `<option value="${escapeHtml(user.id)}" ${activeUserId === user.id ? "selected" : ""}>${escapeHtml(user.name)} · ${escapeHtml(roleLabels[user.role] || user.role)}</option>`)
      .join("")}
  `;
}

function renderWorkOrderPhaseEditorRow(phase, index, options = {}) {
  const lockPhaseKey = options.lockPhaseKey === true && phase.phaseKey !== "custom";
  return `
    <div class="phase-editor-row" data-phase-row="${index}" data-phase-db-id="${escapeHtml(phase.dbId || "")}">
      <div class="phase-editor-topline">
        <span class="phase-index">${index + 1}</span>
        ${
          lockPhaseKey
            ? `
              <input type="hidden" data-phase-field="phaseKey" data-phase-index="${index}" value="${escapeHtml(phase.phaseKey)}" />
              <div class="input phase-key-readonly" aria-label="Tipo de fase">${escapeHtml(workOrderPhaseTitle(phase.phaseKey))}</div>
            `
            : `
              <select class="input" data-phase-field="phaseKey" data-phase-index="${index}" aria-label="Tipo de fase ${index + 1}">
                ${renderPhaseKeyOptions(phase.phaseKey)}
              </select>
            `
        }
        <input class="input" data-phase-field="title" data-phase-index="${index}" value="${escapeHtml(phase.title)}" placeholder="Nombre de fase" />
        <button class="button-ghost small" type="button" data-action="remove-work-order-phase" data-id="${index}" aria-label="Quitar fase ${escapeHtml(phase.title)}">Quitar</button>
      </div>
      <textarea class="textarea compact-textarea" data-phase-field="description" data-phase-index="${index}" placeholder="Qué debe pasar en esta fase">${escapeHtml(phase.description || "")}</textarea>
      <div class="phase-editor-grid">
        <label>
          <span>Responsable</span>
          <select class="input" data-phase-field="assignedTo" data-phase-index="${index}">
            ${renderPhaseAssigneeOptions(phase.assignedTo)}
          </select>
        </label>
        <label>
          <span>Deadline</span>
          <input class="input" type="date" min="${todayDateOnly()}" data-phase-field="dueDate" data-phase-index="${index}" value="${escapeHtml(phase.dueDate || "")}" />
        </label>
        <label>
          <span>Estado</span>
          <select class="input" data-phase-field="status" data-phase-index="${index}">
            ${renderPhaseStatusOptions(phase.status)}
          </select>
        </label>
      </div>
    </div>
  `;
}

function renderWorkOrderPhasesEditor(phases = [], options = {}) {
  const isEditing = options.isEditing === true;
  const expanded = isEditing || options.expanded === true;
  const normalized = normalizeWorkOrderPhases(phases);
  const selectedKeys = new Set(normalized.map((phase) => phase.phaseKey));
  const selectedPhaseRows = normalized.map((phase, index) => renderWorkOrderPhaseEditorRow(phase, index, { lockPhaseKey: !isEditing })).join("");

  if (isEditing) {
    return `
      <div class="field full work-order-phase-editor is-expanded">
        <div class="phase-editor-header">
          <div>
            <label>Fases internas</label>
            <div class="field-help">Edita únicamente las fases que ya pertenecen a esta orden.</div>
          </div>
          <button class="button-ghost small" type="button" data-action="add-work-order-phase">Agregar fase</button>
        </div>
        <div class="phase-editor-list">
          ${selectedPhaseRows || `<div class="empty compact-empty">Esta orden no tiene fases internas.</div>`}
        </div>
      </div>
    `;
  }

  return `
    <div class="field full work-order-phase-editor ${expanded ? "is-expanded" : "is-collapsed"}">
      <div class="phase-editor-header">
        <div>
          <label>Fases internas</label>
          <div class="field-help">Esta orden puede crearse sin fases.</div>
        </div>
        <button
          class="button-ghost small phase-editor-toggle"
          type="button"
          data-action="toggle-work-order-phases"
          aria-expanded="${expanded ? "true" : "false"}"
          aria-controls="work-order-phase-options"
        >
          ${expanded ? "Cerrar fases" : "Agregar fases"}
        </button>
      </div>
      ${
        expanded
          ? `
            <div id="work-order-phase-options" class="work-order-phase-options">
              <div class="phase-catalog" role="group" aria-label="Fases disponibles">
                ${workOrderPhaseCatalog
                  .map(
                    (phase) => `
                      <label class="phase-catalog-option">
                        <input
                          type="checkbox"
                          data-phase-selection="${escapeHtml(phase.key)}"
                          ${selectedKeys.has(phase.key) ? "checked" : ""}
                        />
                        <span>
                          <strong>${escapeHtml(phase.title)}</strong>
                          <small>${escapeHtml(defaultWorkOrderPhaseDescriptions[phase.key] || "Fase interna de la orden")}</small>
                        </span>
                      </label>
                    `,
                  )
                  .join("")}
              </div>
              <div class="phase-editor-selection-summary" aria-live="polite">
                ${normalized.length ? `${normalized.length} fase${normalized.length === 1 ? "" : "s"} seleccionada${normalized.length === 1 ? "" : "s"}` : "Ninguna fase seleccionada"}
              </div>
              <div class="phase-editor-list">
                ${selectedPhaseRows || `<div class="empty compact-empty">Selecciona únicamente las fases que esta OT necesita.</div>`}
              </div>
              <button class="button-ghost small phase-custom-add" type="button" data-action="add-work-order-phase">Agregar fase personalizada</button>
            </div>
          `
          : ""
      }
    </div>
  `;
}

function renderWorkOrderPhaseProgress(order) {
  const phases = workOrderPhases(order);
  if (!phases.length) {
    return `
      <div class="process-timeline-card">
        <div class="section-header compact">
          <div>
            <h3 class="section-title">Fases internas</h3>
            <div class="small-muted">Esta orden no tiene fases. Puedes agregarlas después si la solicitud lo necesita.</div>
          </div>
          <span class="badge">Sin fases</span>
        </div>
      </div>
    `;
  }
  const completedCount = phases.filter((phase) => phase.status === "completed").length;
  const canReorder = canReorderWorkOrderPhases(order);
  return `
    <div class="process-timeline-card">
      <div class="section-header compact">
        <div>
          <h3 class="section-title">Fases internas</h3>
          <div class="small-muted">Seguimiento por fase sin dividir la OT en piezas individuales.</div>
        </div>
        <span class="badge blue">${completedCount}/${phases.length} completadas</span>
      </div>
      <div
        class="phase-progress-track"
        data-phase-reorder-track
        data-order-id="${escapeHtml(order.id)}"
        aria-label="Progreso de fases de la orden"
      >
        ${phases
          .map(
            (phase, index) => `
              <div
                class="phase-progress-step ${phaseStatusClass(phase.status)} ${canReorder ? "is-reorderable" : ""}"
                data-phase-id="${escapeHtml(phaseReorder.phaseIdentity(phase))}"
              >
                ${
                  canReorder
                    ? `<button
                        type="button"
                        class="phase-reorder-handle"
                        data-phase-reorder-handle
                        aria-label="Reordenar fase ${index + 1}: ${escapeHtml(phase.title)}"
                        aria-pressed="false"
                        title="Arrastrar para reordenar"
                      >${iconSvg("grip")}</button>`
                    : ""
                }
                <span class="phase-dot">${index + 1}</span>
                <div>
                  <strong>${escapeHtml(phase.title)}</strong>
                  <p>${renderLinkedText(phase.description || "Sin descripción")}</p>
                  <div class="phase-meta">
                    <span>${escapeHtml(phaseAssigneeLabel(phase.assignedTo))}</span>
                    <span>${phase.dueDate ? escapeHtml(formatDate(phase.dueDate)) : "Sin deadline"}</span>
                    <span>${escapeHtml(workOrderPhaseStatusLabels[phase.status] || phase.status)}</span>
                    ${phase.completedAt ? `<span>Completada ${escapeHtml(formatDate(phase.completedAt))}</span>` : ""}
                  </div>
                  ${renderPhaseStatusControl(phase, order)}
                  ${
                    canCompleteWorkOrderPhase(phase, order)
                      ? `<button class="button-ghost small" data-action="complete-work-order-phase" data-id="${escapeHtml(phase.id)}">Marcar mi fase realizada</button>`
                      : ""
                  }
                  ${renderWorkOrderPhaseComments(phase, order)}
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderWorkOrderStatusOptions(activeValue) {
  const options = Object.entries(workOrderEditableStatusLabels);
  if (activeValue && !workOrderEditableStatusLabels[activeValue] && workOrderStatusLabels[activeValue]) {
    options.push([activeValue, workOrderStatusLabels[activeValue]]);
  }
  return options.map(([value, label]) => renderWorkOrderSelectOption(value, label, activeValue)).join("");
}

function workOrderFileKey(order, file, index) {
  return file.id || file.storagePath || file.url || `${order.id}:${index}`;
}

function renderWorkOrderFileChip(order, file, index, options = {}) {
  const key = workOrderFileKey(order, file, index);
  const type = file.type ? file.type.split("/").pop()?.toUpperCase() : "Archivo";
  const canDelete = options.canDelete ?? false;
  if (canDelete) {
    return `
      <span class="file-chip-group">
        <button class="file-chip" data-action="open-work-order-file" data-id="${escapeHtml(key)}" title="Abrir ${escapeHtml(file.name)}">
          <strong>${escapeHtml(file.name)}</strong>
          <small>${escapeHtml(type || "Archivo")}</small>
        </button>
        <button class="file-delete-button" data-action="delete-work-order-file" data-id="${escapeHtml(key)}" title="Eliminar ${escapeHtml(file.name)}">
          Eliminar
        </button>
      </span>
    `;
  }
  return `
    <button class="file-chip" data-action="open-work-order-file" data-id="${escapeHtml(key)}" title="Abrir ${escapeHtml(file.name)}">
      <strong>${escapeHtml(file.name)}</strong>
      <small>${escapeHtml(type || "Archivo")}</small>
    </button>
  `;
}

function availableWorkOrderAssigneeUsers(selectedAssignees = new Set()) {
  return users
    .filter((user) => user.role !== "cliente" && (user.isActive !== false || selectedAssignees.has(user.id)))
    .sort((a, b) => {
      const selectedDelta = Number(selectedAssignees.has(b.id)) - Number(selectedAssignees.has(a.id));
      if (selectedDelta) return selectedDelta;
      return String(a.name || "").localeCompare(String(b.name || ""), "es", { sensitivity: "base" });
    });
}

function workOrderAssigneeSearchText(user) {
  return normalizeSearchText([user.name, user.email, user.role, roleLabels[user.role]].filter(Boolean).join(" "));
}

function emptyWorkOrderFormDraft() {
  return {
    title: "",
    selectedBrandId: isAllBrandsScope() ? "" : state.currentBrandId,
    assigneeSearch: "",
    assignees: [],
    dueDate: "",
    priority: "medium",
    status: "new",
    category: "diseno",
    artCount: "",
    description: "Contexto, entregable esperado y criterios de aprobación.",
    subtasks: "",
    materialChanges: "",
    notifyOnEmail: true,
    usesPhases: false,
    phasesExpanded: false,
    phases: [],
    phaseSelectionVersion: 2,
    createRequestId: `wo-draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
}

function loadStoredWorkOrderDraft() {
  try {
    const raw = sessionStorage.getItem(WORK_ORDER_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!draft || typeof draft !== "object") return null;
    const restored = { ...emptyWorkOrderFormDraft(), ...draft };
    if (draft.phaseSelectionVersion !== 2) {
      restored.usesPhases = false;
      restored.phasesExpanded = false;
      restored.phases = [];
      restored.phaseSelectionVersion = 2;
    }
    return restored;
  } catch (error) {
    console.warn("No se pudo restaurar el borrador de OT.", error);
    return null;
  }
}

function persistWorkOrderFormDraft() {
  if (!state.workOrderFormDraft) return;
  try {
    sessionStorage.setItem(WORK_ORDER_DRAFT_STORAGE_KEY, JSON.stringify(state.workOrderFormDraft));
  } catch (error) {
    console.warn("No se pudo guardar el borrador temporal de OT.", error);
  }
}

function clearStoredWorkOrderDraft() {
  try {
    sessionStorage.removeItem(WORK_ORDER_DRAFT_STORAGE_KEY);
  } catch (error) {
    console.warn("No se pudo limpiar el borrador temporal de OT.", error);
  }
}

function ensureWorkOrderFormDraft() {
  if (!state.workOrderFormDraft) {
    state.workOrderFormDraft = loadStoredWorkOrderDraft() || emptyWorkOrderFormDraft();
  }
  if (!state.workOrderFormDraft.createRequestId) {
    state.workOrderFormDraft.createRequestId = `wo-draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  if (state.workOrderFormDraft.selectedBrandId && brands.some((brand) => brand.id === state.workOrderFormDraft.selectedBrandId)) {
    state.currentBrandId = state.workOrderFormDraft.selectedBrandId;
  } else if (!isAllBrandsScope()) {
    state.workOrderFormDraft.selectedBrandId = state.currentBrandId;
  }
  if (!state.workOrderDraftPhases.length && state.workOrderFormDraft.phases?.length) {
    state.workOrderDraftPhases = normalizeWorkOrderPhases(state.workOrderFormDraft.phases);
  }
  state.workOrderUsesPhases = state.workOrderDraftPhases.length > 0;
  state.workOrderPhasesExpanded = Boolean(state.workOrderFormDraft.phasesExpanded);
  state.workOrderFormDraft.usesPhases = state.workOrderUsesPhases;
  state.workOrderFormDraft.phasesExpanded = state.workOrderPhasesExpanded;
  state.workOrderFormDraft.phases = state.workOrderDraftPhases;
  state.workOrderFormDraft.phaseSelectionVersion = 2;
  persistWorkOrderFormDraft();
  return state.workOrderFormDraft;
}

function hasMeaningfulWorkOrderDraft(draft = state.workOrderFormDraft) {
  if (!draft) return false;
  const phasesChanged = state.workOrderDraftPhases.length > 0;
  return Boolean(
    draft.title ||
      draft.assigneeSearch ||
      draft.assignees?.length ||
      draft.dueDate ||
      draft.artCount ||
      draft.subtasks ||
      draft.materialChanges ||
      (draft.description && draft.description !== "Contexto, entregable esperado y criterios de aprobación.") ||
      phasesChanged,
  );
}

function normalizeAiText(value = "") {
  return plainText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeSearchText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function inferWorkOrderCategory(text = "") {
  const normalized = normalizeAiText(text);
  const categoryTerms = [
    ["matriz", ["matriz", "calendario", "contenido mensual", "contenido del mes"]],
    ["pauta", ["pauta", "ads", "anuncio", "campana pagada", "colocacion"]],
    ["campana", ["campana", "lanzamiento", "temporada", "promocion"]],
    ["dinamica_digital", ["dinamica", "giveaway", "sorteo", "interaccion"]],
    ["arte_final", ["arte final", "exportar", "adaptacion", "resize", "formatos"]],
    ["cotizacion", ["cotizacion", "presupuesto", "quote", "costeo"]],
    ["propuesta", ["propuesta", "presentacion", "pitch", "deck"]],
    ["edicion", ["editar", "edicion", "video", "reel", "tiktok", "podcast"]],
    ["diseno", ["diseno", "arte", "pieza", "post", "carrusel", "story"]],
    ["copy", ["copy", "caption", "texto", "redaccion"]],
    ["produccion", ["shoot", "produccion", "grabacion", "foto", "filmacion"]],
  ];
  const match = categoryTerms.find(([, terms]) => terms.some((term) => normalized.includes(term)));
  return match?.[0] || "diseno";
}

function parseAiDate(text = "") {
  const normalized = normalizeAiText(text);
  const isoMatch = normalized.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const slashMatch = normalized.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](20\d{2})\b/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const offset = normalized.includes("hoy") ? 0 : normalized.includes("manana") ? 1 : null;
  if (offset !== null) {
    const date = todayAtNoon();
    date.setDate(date.getDate() + offset);
    return isoDateFromDate(date);
  }
  return "";
}

function defaultWorkOrderDueDate(category) {
  const date = todayAtNoon();
  const daysByCategory = {
    pauta: 2,
    arte_final: 2,
    edicion: 3,
    diseno: 4,
    matriz: 5,
    campana: 5,
    produccion: 7,
  };
  date.setDate(date.getDate() + (daysByCategory[category] || 4));
  return isoDateFromDate(date);
}

function inferWorkOrderPriority(text = "", dueDate = "") {
  const normalized = normalizeAiText(text);
  if (["urgente", "hoy", "asap", "prioridad alta", "para manana"].some((term) => normalized.includes(term))) return "high";
  if (daysUntil(dueDate) <= 1) return "high";
  if (["baja", "cuando se pueda", "sin prisa"].some((term) => normalized.includes(term))) return "low";
  return "medium";
}

function workOrderAiSubtasks(category) {
  const subtasksByCategory = {
    matriz: ["Completar estructura de calendario", "Validar pilares y formatos", "Enviar a revisión interna", "Preparar versión para cliente"],
    pauta: ["Confirmar objetivo de campaña", "Revisar presupuesto y fechas", "Preparar assets finales", "Enviar para colocación"],
    campana: ["Definir concepto rector", "Listar entregables", "Asignar piezas por formato", "Preparar revisión interna"],
    dinamica_digital: ["Definir mecánica", "Validar restricciones", "Preparar copies y visuales", "Programar publicación"],
    arte_final: ["Revisar medidas finales", "Exportar formatos", "Subir materiales", "Confirmar aprobación"],
    propuesta: ["Ordenar contexto y objetivo", "Desarrollar propuesta", "Revisar con dirección", "Enviar versión final"],
    cotizacion: ["Levantar alcance", "Calcular recursos", "Preparar documento", "Enviar para aprobación"],
    diseno: ["Revisar brief", "Crear primera propuesta visual", "Subir material para revisión", "Aplicar cambios finales"],
    edicion: ["Revisar material base", "Crear primer corte", "Aplicar cambios", "Exportar versión final"],
    copy: ["Revisar contexto de marca", "Redactar opciones", "Revisar tono y CTA", "Enviar versión final"],
    produccion: ["Confirmar fecha y locación", "Preparar shotlist", "Coordinar equipo", "Subir entregables"],
  };
  return subtasksByCategory[category] || subtasksByCategory.diseno;
}

function workOrderAiMaterialChanges(category, text = "") {
  const normalized = normalizeAiText(text);
  const changes = [];
  if (normalized.includes("cambio") || normalized.includes("ajuste")) changes.push("Aplicar cambios solicitados en materiales existentes");
  if (normalized.includes("formato") || normalized.includes("medida")) changes.push("Preparar adaptaciones por formato requerido");
  if (normalized.includes("copy") || normalized.includes("texto")) changes.push("Validar textos visibles antes de exportar");
  if (category === "arte_final") changes.push("Confirmar versiones finales antes de entrega");
  return changes;
}

function workOrderAiAssignees(category, availableUsers = []) {
  const rolesByCategory = {
    matriz: ["generador", "creativo", "cuentas"],
    pauta: ["pauta", "cuentas"],
    campana: ["creativo", "generador", "cuentas"],
    dinamica_digital: ["creativo", "community", "generador"],
    arte_final: ["disenador", "editor", "creativo"],
    propuesta: ["cuentas", "creativo", "generador"],
    cotizacion: ["cuentas", "operaciones"],
    diseno: ["disenador", "creativo"],
    edicion: ["editor", "creativo"],
    copy: ["generador", "creativo"],
    produccion: ["operaciones", "creativo", "cuentas"],
  };
  const rolePriority = rolesByCategory[category] || rolesByCategory.diseno;
  const selected = [];
  rolePriority.forEach((role) => {
    const user = availableUsers.find((candidate) => candidate.role === role && !selected.includes(candidate.id));
    if (user) selected.push(user.id);
  });
  return selected.slice(0, 3);
}

function inferBrandFromAiText(text = "") {
  const normalized = normalizeAiText(text);
  const scoredBrands = brands
    .map((brand) => {
      const client = getClient(brand.clientId);
      const terms = [
        brand.name,
        brand.shortName,
        brand.id,
        brand.name.replace(/\bGT\b/gi, ""),
        client?.name || "",
      ]
        .filter(Boolean)
        .map(normalizeAiText)
        .filter((term) => term.length >= 3);
      const score = terms.reduce((sum, term) => sum + (normalized.includes(term) ? term.length : 0), 0);
      return { brand, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  return scoredBrands[0]?.brand || null;
}

function inferMentionedAssignees(text = "", availableUsers = []) {
  const normalized = normalizeAiText(text);
  return availableUsers
    .filter((user) => {
      const name = normalizeAiText(user.name);
      const email = normalizeAiText(user.email);
      const role = normalizeAiText(roleLabels[user.role] || user.role);
      const nameParts = name.split(" ").filter((part) => part.length > 2);
      const nameMatched =
        normalized.includes(name) ||
        normalized.includes(email) ||
        nameParts.some((part) => normalized.includes(part) && part.length >= 5);
      const roleMatched = normalized.includes(role) || normalized.includes(normalizeAiText(user.role));
      return nameMatched || roleMatched;
    })
    .map((user) => user.id);
}

function buildWorkOrderAiDraft(prompt = "", availableUsers = [], brandOverride = getBrand()) {
  const brand = brandOverride || getBrand();
  const cleanPrompt = plainText(prompt).trim();
  const category = inferWorkOrderCategory(cleanPrompt);
  const dueDate = parseAiDate(cleanPrompt) || defaultWorkOrderDueDate(category);
  const priority = inferWorkOrderPriority(cleanPrompt, dueDate);
  const categoryLabel = workOrderCategoryLabels[category] || "Solicitud";
  const mentionedAssignees = inferMentionedAssignees(cleanPrompt, availableUsers);
  const firstLine = cleanPrompt.split(/\n|\.|;/).map((part) => part.trim()).find(Boolean) || "";
  const title = firstLine ? firstLine.slice(0, 96) : `Nueva ${categoryLabel.toLowerCase()} para ${brand.shortName}`;
  return {
    title,
    category,
    priority,
    dueDate,
    description: cleanPrompt || `Solicitud de ${categoryLabel.toLowerCase()} para ${brand.shortName}.`,
    subtasks: workOrderAiSubtasks(category),
    materialChanges: workOrderAiMaterialChanges(category, cleanPrompt),
    assignees: Array.from(new Set(mentionedAssignees)).slice(0, 4),
  };
}

function renderWorkOrderAiAssistant(isEditing) {
  return `
    <div class="ai-order-assistant">
      <div>
        <span class="badge green">IA de OTs</span>
        <h3>Asistente de creación</h3>
        <p class="muted">Describe la orden; el sistema sugiere categoría, deadline y subtareas. Solo marca responsables si los mencionas o seleccionas manualmente.</p>
      </div>
      <textarea class="textarea compact-textarea" id="ot-ai-brief" placeholder="Ej: matriz de contenido de julio para Danone, para generador y creativo, deadline 25/05/2026, incluir formatos para reels y carruseles"></textarea>
      <div class="row wrap">
        <button class="button small" data-action="fill-work-order-ai">${isEditing ? "Actualizar borrador" : "Armar borrador"}</button>
        <span class="small-muted">Luego revisas y guardas manualmente la OT.</span>
      </div>
    </div>
  `;
}

function renderPhaseAssignmentPanel() {
  return `
    <div class="gate-panel">
      <div class="gate-icon">FS</div>
      <div>
        <strong>Define responsables y deadlines por fase</strong>
        <p class="muted">
          La OT sigue siendo una sola solicitud. Las fases permiten asignar responsables, fechas y estados independientes sin crear piezas separadas.
        </p>
      </div>
    </div>
  `;
}

function renderUrgentPlannerPanel(category = "diseno", priority = "medium") {
  const plan = urgentWorkOrderPlan({ category, priority });
  return `
    <div class="urgent-planner-panel">
      <div>
        <span class="badge blue">Sugerencia de planificación</span>
        <h3>Planificador de carga</h3>
        <p class="muted">Lumen compara tareas abiertas, vencidas y en revisión para sugerir una persona y un deadline. Esto no marca la OT como urgente.</p>
      </div>
      <div class="urgent-plan-preview" id="urgent-plan-preview">
        <strong>${plan.candidate ? escapeHtml(plan.candidate.name) : "Pendiente de asignar"}</strong>
        <span>${escapeHtml(plan.reason)}</span>
        <span class="badge blue">Fecha sugerida: ${escapeHtml(formatDate(plan.dueDate))}</span>
      </div>
      <button class="button-ghost small" data-action="optimize-work-order-urgency">Aplicar sugerencia</button>
    </div>
  `;
}

function renderWorkOrderProcessTimeline(order) {
  const area = workOrderProcessArea(order.category);
  const activeIndex = processStepIndex(order);
  const stepStateLabel = (index, stateClass) => {
    if (stateClass === "done") return "Completado";
    if (stateClass === "active") return "Actual";
    if (stateClass === "blocked") return "Pausado";
    return `Paso ${index + 1}`;
  };
  return `
    <div class="process-timeline-card">
      <div class="section-header compact">
        <div>
          <h3 class="section-title">Proceso de la OT</h3>
          <div class="small-muted">${escapeHtml(area.label)} según procesos Lumen. La etapa marcada indica dónde va hoy.</div>
        </div>
        <span class="badge blue">${escapeHtml(workOrderStatusLabels[order.status] || order.status)}</span>
      </div>
      <div class="process-timeline">
        ${area.steps
          .map(([title, detail], index) => {
            const stateClass = activeIndex < 0 ? "blocked" : index < activeIndex ? "done" : index === activeIndex ? "active" : "";
            return `
              <div class="process-step ${stateClass}">
                <span class="process-step-index" aria-hidden="true">${index + 1}</span>
                <div>
                  <div class="process-step-header">
                    <strong>${escapeHtml(title)}</strong>
                    <span>${escapeHtml(stepStateLabel(index, stateClass))}</span>
                  </div>
                  <p>${escapeHtml(detail)}</p>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderWorkOrderStageControl(order) {
  const statuses = ["new", "in_progress", "in_review", "completed"];
  return `
    <div class="stage-control">
      ${statuses
        .map(
          (status) => `
            <button
              class="${order.status === status ? "active" : ""}"
              data-action="set-order-status"
              data-id="${escapeHtml(`${order.id}::${status}`)}"
              ${order.status === status ? "disabled" : ""}
            >
              ${escapeHtml(workOrderStatusLabels[status])}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderNoPhaseWorkOrderStatusControl(order) {
  if (!hasConfirmedNoWorkOrderPhases(order)) return "";
  const canChange = canChangeWorkOrderWithoutPhasesStatus(order);
  const processing = state.noPhaseOrderStatusProcessingId === (order.dbId || order.id);
  const currentLabel = noPhaseWorkOrderStatusLabels[order.status]
    || workOrderStatusLabels[order.status]
    || order.status;
  const readOnlyMessage = isArchivedWorkOrder(order)
    ? "La orden está archivada y su estado es de solo lectura."
    : !canChange
      ? "Solo el creador, un responsable o Gestión puede cambiar este estado."
      : ["completed", "cancelled"].includes(order.status) && !canManageWorkOrders()
        ? "La orden está cerrada. Solo Gestión puede reabrirla."
        : "Este control aplica únicamente porque la orden no tiene fases internas.";

  return `
    <section class="no-phase-order-status-section" aria-labelledby="no-phase-order-status-title">
      <div class="no-phase-order-status-heading">
        <div>
          <span class="eyebrow">Seguimiento operativo</span>
          <h3 id="no-phase-order-status-title">Estado de la orden</h3>
        </div>
        <span class="badge blue">${escapeHtml(currentLabel)}</span>
      </div>
      <div class="no-phase-order-status-options" role="group" aria-label="Cambiar estado de la orden">
        ${Object.entries(noPhaseWorkOrderStatusLabels)
          .map(([value, label]) => {
            const active = order.status === value;
            const allowed = noPhaseStatusTransitionAllowed(order, value);
            const disabled = processing || active || !allowed;
            return `
              <button
                type="button"
                class="no-phase-order-status-button ${active ? "is-active" : ""}"
                data-action="request-no-phase-order-status"
                data-id="${escapeHtml(order.id)}"
                data-next-status="${escapeHtml(value)}"
                aria-pressed="${active ? "true" : "false"}"
                aria-disabled="${disabled ? "true" : "false"}"
                ${processing ? 'disabled aria-busy="true"' : ""}
              >
                ${escapeHtml(label)}
              </button>
            `;
          })
          .join("")}
      </div>
      <p class="no-phase-order-status-help" aria-live="polite">${escapeHtml(processing ? "Actualizando estado..." : readOnlyMessage)}</p>
    </section>
  `;
}

function renderNoPhaseOrderStatusDialog(order) {
  const dialog = state.noPhaseOrderStatusDialog;
  if (!order || !dialog || dialog.orderId !== (order.dbId || order.id)) return "";
  const nextLabel = noPhaseWorkOrderStatusLabels[dialog.nextStatus] || dialog.nextStatus;
  const reopening = ["completed", "cancelled"].includes(order.status) && dialog.nextStatus === "in_progress";
  const cancelling = dialog.nextStatus === "cancelled";
  const requiresReason = cancelling || reopening;
  const title = cancelling
    ? "Cancelar orden"
    : reopening
      ? "Reabrir orden"
      : `Marcar como ${nextLabel}`;
  const description = cancelling
    ? "La orden seguirá disponible, pero se detendrá el trabajo. No se borrará ni archivará información."
    : reopening
      ? "La orden volverá a En proceso. Registra el motivo para dejar trazabilidad."
      : "Esta orden no tiene fases internas. Confirma el cambio de estado.";

  return `
    <div class="modal-backdrop no-phase-status-modal-backdrop" data-action="cancel-no-phase-order-status" aria-hidden="true"></div>
    <aside
      class="modal-panel no-phase-status-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="no-phase-status-dialog-title"
      aria-describedby="no-phase-status-dialog-description"
    >
      <button class="modal-close-button" type="button" data-action="cancel-no-phase-order-status" aria-label="Cerrar">×</button>
      <span class="eyebrow">${escapeHtml(order.id)}</span>
      <h2 id="no-phase-status-dialog-title">${escapeHtml(title)}</h2>
      <p id="no-phase-status-dialog-description">${escapeHtml(description)}</p>
      ${
        requiresReason
          ? `
            <div class="field">
              <label for="no-phase-status-reason">Motivo obligatorio</label>
              <textarea
                class="textarea"
                id="no-phase-status-reason"
                data-no-phase-status-reason
                aria-describedby="no-phase-status-reason-error"
                aria-invalid="${dialog.error ? "true" : "false"}"
                placeholder="Explica brevemente el motivo"
              >${escapeHtml(dialog.reason || "")}</textarea>
              <div class="field-error" id="no-phase-status-reason-error" role="alert">${escapeHtml(dialog.error || "")}</div>
            </div>
          `
          : ""
      }
      <div class="row wrap no-phase-status-modal-actions">
        <button type="button" class="button" data-action="confirm-no-phase-order-status">
          Confirmar ${escapeHtml(nextLabel)}
        </button>
        <button type="button" class="button-ghost" data-action="cancel-no-phase-order-status">Cancelar</button>
      </div>
    </aside>
  `;
}

function selectedWorkOrderAssigneeIdsFromForm() {
  const assigneeCheckboxes = Array.from(document.querySelectorAll("[data-ot-assignee]:checked"));
  const assigneeSelect = document.getElementById("ot-assignees");
  if (assigneeCheckboxes.length) return assigneeCheckboxes.map((input) => input.value);
  if (assigneeSelect) return Array.from(assigneeSelect.selectedOptions).map((option) => option.value);
  return [];
}

function readWorkOrderFormDraftFromDom() {
  const artCountInput = document.getElementById("ot-art-count");
  const currentDraft = state.workOrderFormDraft || emptyWorkOrderFormDraft();
  return {
    title: document.getElementById("ot-title")?.value || "",
    selectedBrandId: isAllBrandsScope() ? currentDraft.selectedBrandId || "" : state.currentBrandId,
    assigneeSearch: document.getElementById("ot-assignee-search")?.value || "",
    assignees: selectedWorkOrderAssigneeIdsFromForm(),
    dueDate: document.getElementById("ot-due-date")?.value || "",
    priority: document.getElementById("ot-priority")?.value || "medium",
    status: document.getElementById("ot-status")?.value || "new",
    category: document.getElementById("ot-category")?.value || "diseno",
    artCount: artCountInput ? artCountInput.value : "",
    description: document.getElementById("ot-description")?.value || "",
    subtasks: document.getElementById("ot-subtasks")?.value || "",
    materialChanges: document.getElementById("ot-material-changes")?.value || "",
    notifyOnEmail: document.getElementById("ot-email")?.checked ?? true,
    usesPhases: state.workOrderDraftPhases.length > 0,
    phasesExpanded: state.workOrderPhasesExpanded,
    phaseSelectionVersion: 2,
    createRequestId: currentDraft.createRequestId,
  };
}

function syncWorkOrderFormDraftFromForm() {
  if (!document.getElementById("ot-title")) return;
  const draft = readWorkOrderFormDraftFromDom();
  state.workOrderFormDraft = draft;
  const phaseRows = document.querySelectorAll("[data-phase-row]");
  if (phaseRows.length) {
    state.workOrderDraftPhases = getWorkOrderPhaseFormValues();
  }
  state.workOrderUsesPhases = state.workOrderDraftPhases.length > 0;
  state.workOrderFormDraft.usesPhases = state.workOrderUsesPhases;
  state.workOrderFormDraft.phases = state.workOrderDraftPhases;
  persistWorkOrderFormDraft();
}

function resetWorkOrderFormDraft({ clearStorage = true } = {}) {
  state.workOrderFormDraft = null;
  state.workOrderDraftPhases = [];
  state.workOrderUsesPhases = false;
  state.workOrderPhasesExpanded = false;
  if (clearStorage) clearStoredWorkOrderDraft();
}

function renderWorkOrderForm(order = null) {
  const isEditing = Boolean(order);
  const canUseForm = isEditing ? canManageWorkOrders() : canCreateWorkOrders();
  if (!canUseForm) {
    return `
      <div class="panel section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Órdenes con control de Cuentas</h2>
            <div class="small-muted">Puedes consultar el trabajo, pero esta accion queda centralizada.</div>
          </div>
          <span class="badge amber">${isEditing ? "Solo Dirección / Cuentas" : "Creación restringida"}</span>
        </div>
        <div class="admin-note">
          ${isEditing ? "Para editar, avanzar o adjuntar archivos a una OT necesitas rol Admin, Dirección o Cuentas." : "Para crear una OT necesitas rol Admin, Dirección, Cuentas, Coordinación o Ejecutivo."}
        </div>
      </div>
    `;
  }
  const draft = isEditing ? state.workOrderFormDraft : ensureWorkOrderFormDraft();
  const selectedAssignees = new Set(
    Array.isArray(draft?.assignees) ? draft.assignees : isEditing ? orderAssignees(order) : [],
  );
  const parsedDescription = splitWorkOrderDescription(order?.description || "");
  const availableUsers = availableWorkOrderAssigneeUsers(selectedAssignees);
  const selectedUsers = availableUsers.filter((user) => selectedAssignees.has(user.id));
  const files = isEditing ? orderFiles(order) : [];
  const formPhases = state.workOrderDraftPhases.length
    ? normalizeWorkOrderPhases(state.workOrderDraftPhases)
    : isEditing
      ? workOrderPhases(order)
      : [];
  const titleValue = draft?.title ?? (isEditing ? order.title : "");
  const descriptionValue = draft?.description ?? (isEditing ? parsedDescription.description || "" : "Contexto, entregable esperado y criterios de aprobación.");
  const subtasksValue = draft?.subtasks ?? parsedDescription.subtasks.join("\n");
  const materialChangesValue = draft?.materialChanges ?? parsedDescription.materialChanges.join("\n");
  const dueDateValue = draft?.dueDate ?? (isEditing ? order.dueDate || "" : "");
  const priorityValue = draft?.priority ?? (isEditing ? order.priority : "medium");
  const statusValue = draft?.status ?? (isEditing ? order.status : "new");
  const editingNoPhaseOrder = Boolean(isEditing && hasConfirmedNoWorkOrderPhases(order));
  const categoryValue = draft?.category ?? (isEditing ? order.category : "diseno");
  const artCountValue = draft?.artCount ?? (isEditing && order.artCount !== null && order.artCount !== undefined ? String(order.artCount) : "");
  const notifyOnEmail = draft?.notifyOnEmail ?? (isEditing ? order.notifyOnEmail !== false : true);
  const assigneeSearchValue = draft?.assigneeSearch || "";
  const normalizedAssigneeSearch = normalizeSearchText(assigneeSearchValue);
  const emailRecipientSummary = brandEmailRecipientSummary(state.currentBrandId, Array.from(selectedAssignees));

  return `
    <div class="panel section">
      <div class="section-header">
        <div>
          <h2 class="section-title">${isEditing ? `Editar ${order.id}` : "Crear orden de trabajo"}</h2>
          <div class="small-muted">
            ${isEditing ? "Actualiza responsables, estado, deadline, descripcion o adjuntos." : "Asignacion + email de notificacion + seguimiento semanal."}
          </div>
        </div>
        <span class="badge blue">${isEditing ? "Edicion activa" : "Foco operativo"}</span>
      </div>
      ${ENABLE_AI_ASSISTANT ? renderWorkOrderAiAssistant(isEditing) : ""}
      ${renderPhaseAssignmentPanel()}
      ${renderUrgentPlannerPanel(categoryValue, priorityValue)}
      <div class="form-grid">
        <div class="field full">
          <label>Titulo</label>
          <input class="input" id="ot-title" value="${escapeHtml(titleValue)}" placeholder="Ej: Matriz de contenido julio para Silk" />
        </div>
        <div class="field">
          <label>Responsables</label>
          <div class="assignee-picker">
            <input class="input assignee-search" id="ot-assignee-search" autocomplete="off" placeholder="Buscar responsable..." value="${escapeHtml(assigneeSearchValue)}" />
            <div class="assignee-selected-list" aria-live="polite">
              ${
                selectedUsers.length
                  ? selectedUsers
                      .map(
                        (user) => `
                          <span class="assignee-chip">
                            <strong>${escapeHtml(user.name)}</strong>
                            <small>${escapeHtml(roleLabels[user.role] || user.role)}</small>
                          </span>
                        `,
                      )
                      .join("")
                  : `<span class="muted">Sin responsables seleccionados</span>`
              }
            </div>
            <div class="assignee-options">
              ${availableUsers
                .map(
                  (user) => {
                    const userLoad = workloadLabelForUser(user.id);
                    return `
                    <label class="assignee-option ${normalizedAssigneeSearch && !workOrderAssigneeSearchText(user).includes(normalizedAssigneeSearch) ? "is-filtered-out" : ""}" data-assignee-option="${escapeHtml(workOrderAssigneeSearchText(user))}">
                      <input type="checkbox" data-ot-assignee value="${user.id}" ${selectedAssignees.has(user.id) ? "checked" : ""} />
                      <span>
                        <strong>${escapeHtml(user.name)}</strong>
                        <small>${escapeHtml(roleLabels[user.role] || user.role)} · ${escapeHtml(userLoad)}</small>
                        <em>${escapeHtml(user.email)}</em>
                      </span>
                    </label>
                  `;
                  },
                )
                .join("") || `<div class="empty compact-empty">No hay responsables internos disponibles</div>`}
              <div class="empty compact-empty assignee-no-results ${normalizedAssigneeSearch && !availableUsers.some((user) => workOrderAssigneeSearchText(user).includes(normalizedAssigneeSearch)) ? "" : "is-hidden"}">
                Sin resultados para esta búsqueda
              </div>
            </div>
          </div>
          <div class="field-help">Marca una o varias personas. El buscador filtra por nombre, correo o rol.</div>
        </div>
        <div class="field">
          <label>Deadline</label>
          <input class="input" id="ot-due-date" type="date" min="${todayDateOnly()}" value="${escapeHtml(dueDateValue)}" />
        </div>
        <div class="field">
          <label>Prioridad</label>
          <select class="input" id="ot-priority">
            ${renderWorkOrderSelectOption("medium", "Media", priorityValue)}
            ${renderWorkOrderSelectOption("high", "Alta", priorityValue)}
            ${renderWorkOrderSelectOption("low", "Baja", priorityValue)}
          </select>
        </div>
        <div class="field">
          <label>Estado</label>
          ${
            editingNoPhaseOrder
              ? `
                <input id="ot-status" type="hidden" value="${escapeHtml(statusValue)}" />
                <div class="input read-only-status-field" aria-readonly="true">${escapeHtml(noPhaseWorkOrderStatusLabels[statusValue] || workOrderStatusLabels[statusValue] || statusValue)}</div>
                <div class="field-help">Cambia el estado desde la sección Estado de la orden.</div>
              `
              : `
                <select class="input" id="ot-status">
                  ${renderWorkOrderStatusOptions(statusValue)}
                </select>
              `
          }
        </div>
        <div class="field">
          <label>Categoria</label>
          <select class="input" id="ot-category">
            ${Object.entries(workOrderCategoryOptions)
              .map(([value, label]) => renderWorkOrderSelectOption(value, label, categoryValue))
              .join("")}
            ${!workOrderCategoryOptions[categoryValue] && workOrderCategoryLabels[categoryValue] ? renderWorkOrderSelectOption(categoryValue, `${workOrderCategoryLabels[categoryValue]} (anterior)`, categoryValue) : ""}
          </select>
        </div>
        <div class="field">
          <label>Cantidad de artes</label>
          <input class="input" id="ot-art-count" type="number" min="0" step="1" value="${escapeHtml(artCountValue)}" placeholder="Opcional" />
          <div class="field-help">Dato informativo; no crea subtareas ni fases.</div>
        </div>
        <div class="field full">
          <label>Descripcion</label>
          <textarea class="textarea" id="ot-description">${escapeHtml(descriptionValue)}</textarea>
        </div>
        <div class="field">
          <label>Subtareas</label>
          <textarea class="textarea compact-textarea" id="ot-subtasks" placeholder="Una subtarea por linea">${escapeHtml(subtasksValue)}</textarea>
          <div class="field-help">Ej: Copy aprobado, Arte final, Exportar piezas, Programar.</div>
        </div>
        <div class="field">
          <label>Cambios en materiales</label>
          <textarea class="textarea compact-textarea" id="ot-material-changes" placeholder="Una solicitud o cambio por linea">${escapeHtml(materialChangesValue)}</textarea>
          <div class="field-help">Usalo para ajustes de arte, copy, formatos o piezas faltantes.</div>
        </div>
        ${renderWorkOrderPhasesEditor(formPhases, { isEditing, expanded: state.workOrderPhasesExpanded })}
        ${
          files.length
            ? `
              <div class="field full">
                <label>Archivos actuales</label>
                <div class="file-list">
                  ${files.map((file, index) => renderWorkOrderFileChip(order, file, index, { canDelete: canDeleteWorkOrderFile(order, file) })).join("")}
                </div>
                <div class="field-help">Puedes abrir un archivo para revisarlo o eliminarlo si lo subiste por error.</div>
              </div>
            `
            : ""
        }
        <div class="field full">
          <label>${isEditing ? "Agregar archivos" : "Archivos adjuntos"}</label>
          <input class="input file-input" id="ot-files" type="file" multiple />
          <div class="field-help">${isEditing ? "Los nuevos archivos se agregan sin quitar los existentes." : "Los archivos quedan vinculados a la OT y disponibles para el equipo asignado."}</div>
        </div>
        <div class="full row wrap form-actions">
          <label class="checkbox-line">
            <input id="ot-email" type="checkbox" ${notifyOnEmail ? "checked" : ""} />
            Enviar notificacion por email
          </label>
          <span class="field-help email-recipient-help">${escapeHtml(emailRecipientSummary)} Configura la lista por marca en Notificaciones.</span>
          <button class="button" data-action="${isEditing ? "update-work-order" : "create-work-order"}" ${!isEditing && state.workOrderSubmitting ? "disabled aria-busy=\"true\"" : ""}>
            ${isEditing ? "Guardar cambios" : state.workOrderSubmitting ? "Creando..." : "Crear OT"}
          </button>
          ${isEditing ? `<button class="button-ghost" data-action="cancel-edit-work-order">Cancelar</button>` : `<button class="button-ghost" data-action="close-create-work-order">Cancelar</button>`}
        </div>
      </div>
    </div>
  `;
}

function renderWorkOrderDetailPanel(order) {
  if (!order) return "";
  const brand = getBrand(order.brandId);
  const client = getClient(brand.clientId);
  const assignees = orderAssignees(order);
  const files = orderFiles(order);
  const parsedDescription = splitWorkOrderDescription(order.description || "");
  const urgency = workOrderUrgency(order);
  const showTimingBadge = shouldRenderWorkOrderTimingBadge(order);
  const canManage = canManageWorkOrders();
  const canManageUrgencyFlag = canManageUrgency();
  const canArchive = canArchiveWorkOrders();
  const canUploadMaterials = canUploadWorkOrderMaterials(order);
  const isArchived = Boolean(order.archivedAt || order.archived_at);
  const isUrgent = Boolean(order.isUrgent || order.is_urgent);
  const showUrgencyButton = canManageUrgencyFlag && !isArchived;
  const hasNoPhases = hasConfirmedNoWorkOrderPhases(order);
  debugInteraction("urgency-render-actions", {
    normalizedRole: normalizeRoleKey(dataState.profile?.role || ""),
    canManageUrgency: canManageUrgencyFlag,
    isArchived,
    isUrgent,
    showUrgencyButton,
    orderId: order.dbId || order.id,
    code: order.id || order.code,
  });

  return `
    <button class="drawer-backdrop" type="button" data-action="close-work-order-detail" aria-label="Cerrar detalle de OT"></button>
    <aside class="work-order-detail-drawer" data-order-detail="${escapeHtml(order.id)}" aria-label="Detalle de orden de trabajo">
      <div class="drawer-panel">
      <button class="drawer-close-button" type="button" data-action="close-work-order-detail" aria-label="Cerrar detalle">×</button>
      <div class="section-header">
        <div>
          <div class="row wrap">
            <span class="badge">${escapeHtml(order.id)}</span>
            ${showTimingBadge ? `<span class="badge ${urgency.cls}">${escapeHtml(urgency.label)}</span>` : ""}
            ${showTimingBadge && isUrgent ? `<span class="badge red">Urgente</span>` : ""}
            <span class="badge ${order.priority === "high" ? "red" : order.priority === "medium" ? "amber" : "green"}">${escapeHtml(workOrderPriorityLabels[order.priority] || order.priority)}</span>
          </div>
          <h2 class="section-title">${escapeHtml(order.title)}</h2>
          <div class="small-muted">${escapeHtml(client?.name || "Cliente")} / ${escapeHtml(brand.shortName)} / deadline ${escapeHtml(formatDate(order.dueDate))}</div>
        </div>
        <div class="row wrap">
          ${canManage ? `<button class="button-ghost small" data-action="edit-work-order" data-id="${order.id}">Editar</button>` : ""}
          ${
            showUrgencyButton
              ? `
                <button
                  type="button"
                  class="${isUrgent ? "button-ghost" : "button-danger"} small"
                  data-action="${isUrgent ? "unmark-work-order-urgent" : "mark-work-order-urgent"}"
                  data-id="${escapeHtml(order.id)}"
                  data-order-id="${escapeHtml(order.dbId || order.id)}"
                >
                  ${isUrgent ? "Quitar urgencia" : "Marcar urgencia"}
                </button>
              `
              : ""
          }
          ${
            canArchive
              ? isArchived
                ? `<button class="button-ghost small" data-action="unarchive-work-order" data-id="${order.id}">Restaurar</button>`
                : `<button class="button-danger small" data-action="archive-work-order" data-id="${order.id}">Archivar</button>`
              : ""
          }
          <button class="button-ghost small" data-action="close-work-order-detail">Cerrar</button>
        </div>
      </div>
      ${canManage && !isArchived && !hasNoPhases ? renderWorkOrderStageControl(order) : ""}
      ${renderWorkOrderPhaseProgress(order)}
      <div class="work-order-detail-grid">
        <div class="detail-block">
          <span>Estado</span>
          <strong>${isArchived ? "Archivada" : escapeHtml(workOrderStatusLabels[order.status] || order.status)}</strong>
        </div>
        <div class="detail-block">
          <span>Categoria</span>
          <strong>${escapeHtml(workOrderCategoryLabels[order.category] || order.category)}</strong>
        </div>
        <div class="detail-block">
          <span>Cantidad de artes</span>
          <strong>${order.artCount !== null && order.artCount !== undefined ? escapeHtml(String(order.artCount)) : "No especificada"}</strong>
        </div>
        <div class="detail-block">
          <span>Responsables</span>
          <div class="assignee-row">
            ${
              assignees
                .map((userId) => `<span class="avatar-pill" title="${escapeHtml(userEmail(userId))}">${escapeHtml(userName(userId))}</span>`)
                .join("") || `<strong>Sin asignar</strong>`
            }
          </div>
        </div>
        <div class="detail-block">
          <span>Email</span>
          <strong>${order.notifyOnEmail ? "Notificaciones activas" : "Sin notificaciones"}</strong>
        </div>
        <div class="detail-block">
          <span>Creada por</span>
          <strong>${escapeHtml(workOrderCreatorName(order))}</strong>
          <small>${escapeHtml(formatWorkOrderCreatedAt(order.createdAt))}</small>
        </div>
      </div>
      <div class="grid grid-2 top-aligned-grid">
        <div class="detail-readable-block">
          <h3>Brief</h3>
          <p>${renderLinkedText(parsedDescription.description || "Sin descripcion")}</p>
        </div>
        <div class="detail-readable-block">
          <h3>Archivos y materiales</h3>
          <div class="file-list">
            ${files.map((file, index) => renderWorkOrderFileChip(order, file, index, { canDelete: canDeleteWorkOrderFile(order, file) })).join("") || `<span class="muted">Sin archivos adjuntos</span>`}
          </div>
          ${
            canUploadMaterials
              ? `
                <div class="material-upload-box inline-upload">
                  <label>Subir materiales para aprobación/cambios</label>
                  <div class="material-upload-row">
                    <input class="input file-input" data-material-files="${order.id}" type="file" multiple />
                    <button class="button-ghost small" data-action="upload-order-materials" data-id="${order.id}">Subir</button>
                  </div>
                </div>
              `
              : ""
          }
        </div>
      </div>
      ${
        parsedDescription.subtasks.length || parsedDescription.materialChanges.length
          ? `
            <div class="grid grid-2 top-aligned-grid">
              <div class="detail-readable-block">
                <h3>Subtareas</h3>
                ${
                  parsedDescription.subtasks.length
                    ? `<ul class="subtask-list">${parsedDescription.subtasks.map((task) => `<li>${renderLinkedText(task)}</li>`).join("")}</ul>`
                    : `<span class="muted">Sin subtareas</span>`
                }
              </div>
              <div class="detail-readable-block">
                <h3>Cambios en materiales</h3>
                ${
                  parsedDescription.materialChanges.length
                    ? `<ul class="subtask-list">${parsedDescription.materialChanges.map((change) => `<li>${renderLinkedText(change)}</li>`).join("")}</ul>`
                    : `<span class="muted">Sin cambios registrados</span>`
                }
              </div>
            </div>
          `
          : ""
      }
      ${renderWorkOrderConversation(order)}
      ${renderNoPhaseWorkOrderStatusControl(order)}
      </div>
    </aside>
    ${renderNoPhaseOrderStatusDialog(order)}
  `;
}

function renderWorkOrders() {
  if (isOperationalUserRole()) {
    return renderMyWorkOrdersWorkspace();
  }
  const allScopeOrders = brandOrders(state.currentBrandId, { includeArchived: true });
  const archivedOrders = allScopeOrders.filter(isArchivedWorkOrder);
  const browsingArchived = state.showArchivedWorkOrders || state.workOrderFilters?.quick === "archived";
  const activeScopeOrders = browsingArchived ? archivedOrders : allScopeOrders.filter((order) => !isArchivedWorkOrder(order));
  const orders = filterWorkOrdersForPanel(activeScopeOrders);
  const openOrders = orders.filter(isOpenWorkOrder);
  const overdueOrders = openOrders.filter((order) => daysUntil(order.dueDate) < 0);
  const allBrands = isAllBrandsScope();
  const detailPanel = state.editingWorkOrderId ? "" : renderWorkOrderDetailPanel(selectedViewingOrder());
  const setupSection = state.editingWorkOrderId ? renderWorkOrderSetupSection(allBrands) : "";
  const createModal = state.creatingWorkOrder ? renderCreateWorkOrderModal(allBrands) : "";
  const operationsPanel = renderWorkOrderOperationsPanel(orders, allBrands, archivedOrders.length);
  return `
    ${renderWorkOrdersHeader(allBrands)}
    <section class="executive-kpis">
      ${renderKpiCard("OTs abiertas", openOrders.length, allBrands ? "OTs de todas las marcas" : "No completadas", "dark")}
      ${renderKpiCard("Vencidas", overdueOrders.length, "Requieren seguimiento", overdueOrders.length ? "danger" : "neutral")}
      ${renderKpiCard("En revisión", orders.filter((order) => order.status === "in_review").length, "Esperando validación", "warning")}
      ${renderKpiCard("Sin responsable", openOrders.filter((order) => !orderAssignees(order).length).length, "Pendientes de asignar", openOrders.some((order) => !orderAssignees(order).length) ? "danger" : "neutral")}
    </section>
    ${renderWorkOrderFilters(allBrands)}
    ${setupSection}
    ${operationsPanel}
    ${detailPanel}
    ${createModal}
  `;
}

function renderWorkOrderStatusSelect(order) {
  return `
    <select class="input status-select" data-status-select="${escapeHtml(order.id)}">
      ${renderWorkOrderStatusOptions(order.status)}
    </select>
  `;
}

function workOrderMatchesQuickFilter(order, filter) {
  if (!filter) return true;
  const dueDays = daysUntil(workOrderEffectiveDueDate(order));
  const hasAssignee = orderAssignees(order).length > 0;
  if (filter === "archived") return isArchivedWorkOrder(order);
  if (filter === "new") return order.status === "new";
  if (filter === "critical") return criticalWorkOrders([order]).length > 0;
  if (filter === "overdue") return isOpenWorkOrder(order) && dueDays < 0;
  if (filter === "today") return isOpenWorkOrder(order) && dueDays === 0;
  if (filter === "week") return isOpenWorkOrder(order) && dueDays >= 0 && dueDays <= 7;
  if (filter === "unassigned") return isOpenWorkOrder(order) && !hasAssignee;
  if (filter === "review") return order.status === "in_review";
  if (filter === "high") return order.priority === "high";
  if (filter === "urgent") return isOpenWorkOrder(order) && isUrgentWorkOrder(order);
  return true;
}

function filterWorkOrdersForPanel(orders) {
  const filters = state.workOrderFilters || {};
  return orders.filter((order) => {
    const search = (filters.search || "").trim().toLowerCase();
    if (search) {
      const brand = getBrand(order.brandId);
      const client = getClient(brand.clientId);
      const haystack = [
        order.id,
        order.title,
        order.description,
        brand.shortName,
        brand.name,
        client?.name,
        orderAssignees(order).map(userName).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (filters.assignee && !orderAssignees(order).includes(filters.assignee)) return false;
    if (filters.status && order.status !== filters.status) return false;
    if (filters.priority && order.priority !== filters.priority) return false;
    if (filters.due && !inDateRange(order.dueDate, filters.due, filters.due)) return false;
    if (!workOrderMatchesQuickFilter(order, filters.quick)) return false;
    return true;
  });
}

function renderQuickFilterChip(value, label) {
  const active = state.workOrderFilters?.quick === value;
  return `<button class="quick-chip ${active ? "active" : ""}" data-workorder-quick-filter="${value}">${label}</button>`;
}

function renderWorkOrderFilters(allBrands) {
  const filters = state.workOrderFilters || {};
  return `
    <section class="panel section work-order-filter-panel work-order-control-bar">
      <div class="section-header">
        <div>
          <h2 class="section-title">Bandeja operativa</h2>
          <div class="small-muted">Busca, filtra y abre solo el grupo que necesitas revisar.</div>
        </div>
        <button class="button-ghost small" data-action="clear-work-order-filters">Limpiar filtros</button>
      </div>
      <div class="form-grid work-order-filter-grid">
        <div class="field search-field">
          <label>Buscar</label>
          <input class="input" data-workorder-filter="search" placeholder="Buscar por OT, marca, título o responsable" value="${escapeHtml(filters.search || "")}" />
        </div>
        <div class="field">
          <label>Cliente / marca</label>
          <select class="input js-brand-select">
            ${renderBrandOptions(state.currentBrandId)}
          </select>
        </div>
        <div class="field">
          <label>Responsable</label>
          <select class="input" data-workorder-filter="assignee">
            <option value="">Todos</option>
            ${internalUsers()
              .map((user) => `<option value="${escapeHtml(user.id)}" ${filters.assignee === user.id ? "selected" : ""}>${escapeHtml(user.name)}</option>`)
              .join("")}
          </select>
        </div>
        <div class="field">
          <label>Estado</label>
          <select class="input" data-workorder-filter="status">
            <option value="">Todos</option>
            ${Object.entries(workOrderEditableStatusLabels)
              .map(([value, label]) => `<option value="${escapeHtml(value)}" ${filters.status === value ? "selected" : ""}>${escapeHtml(label)}</option>`)
              .join("")}
          </select>
        </div>
        <div class="field">
          <label>Prioridad</label>
          <select class="input" data-workorder-filter="priority">
            <option value="">Todas</option>
            ${Object.entries(workOrderPriorityLabels)
              .map(([value, label]) => `<option value="${escapeHtml(value)}" ${filters.priority === value ? "selected" : ""}>${escapeHtml(label)}</option>`)
              .join("")}
          </select>
        </div>
        <div class="field">
          <label>Fecha</label>
          <input class="input" type="date" data-workorder-filter="due" value="${escapeHtml(filters.due || "")}" />
        </div>
        <div class="field">
          <label>Vencimiento</label>
          <select class="input" data-workorder-filter="quick">
            <option value="">Todos</option>
            <option value="critical" ${filters.quick === "critical" ? "selected" : ""}>Críticas</option>
            <option value="overdue" ${filters.quick === "overdue" ? "selected" : ""}>Vencidas</option>
            <option value="today" ${filters.quick === "today" ? "selected" : ""}>Hoy</option>
            <option value="week" ${filters.quick === "week" ? "selected" : ""}>Esta semana</option>
            <option value="archived" ${filters.quick === "archived" ? "selected" : ""}>Archivadas</option>
          </select>
        </div>
      </div>
      <div class="quick-chip-row">
        ${renderQuickFilterChip("critical", "Críticas")}
        ${renderQuickFilterChip("urgent", "Urgentes")}
        ${renderQuickFilterChip("overdue", "Vencidas")}
        ${renderQuickFilterChip("unassigned", "Sin responsable")}
        ${renderQuickFilterChip("review", "En revisión")}
        ${renderQuickFilterChip("today", "Hoy")}
        ${renderQuickFilterChip("week", "Esta semana")}
        ${renderQuickFilterChip("new", "Nuevas")}
        ${renderQuickFilterChip("archived", "Archivadas")}
      </div>
    </section>
  `;
}

function sortOperationalOrders(orders) {
  return orders.slice().sort((a, b) => {
    const scoreDiff = workOrderCriticalScore(b) - workOrderCriticalScore(a);
    if (scoreDiff) return scoreDiff;
    const openDiff = Number(isOpenWorkOrder(b)) - Number(isOpenWorkOrder(a));
    if (openDiff) return openDiff;
    return daysUntil(workOrderEffectiveDueDate(a)) - daysUntil(workOrderEffectiveDueDate(b));
  });
}

function takeWorkOrderGroup(orders, usedIds, predicate) {
  const picked = orders.filter((order) => !usedIds.has(order.id) && predicate(order));
  picked.forEach((order) => usedIds.add(order.id));
  return picked;
}

function buildPriorityWorkOrderGroups(orders) {
  const sorted = sortOperationalOrders(orders);
  const usedIds = new Set();
  const critical = takeWorkOrderGroup(sorted, usedIds, (order) => {
    const dueDays = daysUntil(workOrderEffectiveDueDate(order));
    return isOpenWorkOrder(order) && (dueDays < 0 || dueDays <= 1 || isUrgentWorkOrder(order));
  });
  const unassigned = takeWorkOrderGroup(sorted, usedIds, (order) => isOpenWorkOrder(order) && !orderAssignees(order).length);
  const review = takeWorkOrderGroup(sorted, usedIds, (order) => order.status === "in_review");
  const inProgress = takeWorkOrderGroup(sorted, usedIds, (order) => order.status === "in_progress");
  const fresh = takeWorkOrderGroup(sorted, usedIds, (order) => order.status === "new");
  const delivered = takeWorkOrderGroup(sorted, usedIds, (order) => isDeliveredWorkOrder(order));
  const archived = takeWorkOrderGroup(sorted, usedIds, (order) => isArchivedWorkOrder(order));

  return [
    {
      key: "critical",
      title: "Críticas / vencidas",
      description: "Vencidas, alta prioridad o con deadline inmediato.",
      orders: critical,
      open: true,
      tone: "danger",
    },
    {
      key: "unassigned",
      title: "Sin responsable",
      description: "Necesitan asignación antes de avanzar.",
      orders: unassigned,
      open: false,
      tone: "warning",
    },
    {
      key: "review",
      title: "En revisión interna",
      description: "Esperando validación o cambios internos.",
      orders: review,
      open: false,
      tone: "warning",
    },
    {
      key: "in_progress",
      title: "En proceso",
      description: "Trabajo activo del equipo.",
      orders: inProgress,
      open: false,
      tone: "info",
    },
    {
      key: "new",
      title: "Nuevas",
      description: "Entradas recientes por iniciar.",
      orders: fresh,
      open: false,
      tone: "neutral",
    },
    {
      key: "delivered",
      title: "Entregadas / programadas",
      description: "Cerradas operativamente o listas para publicar.",
      orders: delivered,
      open: false,
      tone: "success",
    },
    {
      key: "archived",
      title: "Archivadas",
      description: "Fuera del panel activo.",
      orders: archived,
      open: state.showArchivedWorkOrders || state.workOrderFilters?.quick === "archived",
      tone: "neutral",
    },
  ].filter((group) => group.orders.length || ["critical", "unassigned", "review", "in_progress", "new"].includes(group.key));
}

function buildStatusWorkOrderGroups(orders) {
  const statusOrder = ["new", "in_progress", "in_review", "client_approved", "scheduled", "completed", "cancelled"];
  return statusOrder
    .map((status) => ({
      key: `status-${status}`,
      title: workOrderStatusLabels[status] || status,
      description: "Órdenes agrupadas por etapa actual.",
      orders: sortOperationalOrders(orders.filter((order) => order.status === status && !isArchivedWorkOrder(order))),
      open: status === "in_review" || status === "in_progress",
      tone: status === "completed" || status === "client_approved" || status === "scheduled" ? "success" : "neutral",
    }))
    .filter((group) => group.orders.length);
}

function buildResponsibleWorkOrderGroups(orders) {
  const groups = [];
  const unassigned = sortOperationalOrders(orders.filter((order) => !orderAssignees(order).length && isOpenWorkOrder(order)));
  if (unassigned.length) {
    groups.push({
      key: "responsible-unassigned",
      title: "Sin responsable",
      description: "Órdenes que necesitan dueño.",
      orders: unassigned,
      open: true,
      tone: "warning",
    });
  }

  internalUsers()
    .map((user) => ({
      user,
      orders: sortOperationalOrders(orders.filter((order) => orderAssignees(order).includes(user.id))),
    }))
    .filter((entry) => entry.orders.length)
    .sort((a, b) => b.orders.filter(isOpenWorkOrder).length - a.orders.filter(isOpenWorkOrder).length)
    .forEach(({ user, orders: userOrders }) => {
      const open = userOrders.filter(isOpenWorkOrder).length;
      const overdue = userOrders.filter((order) => isOpenWorkOrder(order) && daysUntil(order.dueDate) < 0).length;
      groups.push({
        key: `responsible-${user.id}`,
        title: `${user.name}`,
        description: `${open} abiertas / ${overdue} vencidas`,
        orders: userOrders,
        open: overdue > 0,
        tone: overdue ? "danger" : "neutral",
      });
    });
  return groups;
}

function buildBrandWorkOrderGroups(orders) {
  return brands
    .map((brand) => {
      const brandGroupOrders = sortOperationalOrders(orders.filter((order) => order.brandId === brand.id));
      const open = brandGroupOrders.filter(isOpenWorkOrder).length;
      const overdue = brandGroupOrders.filter((order) => isOpenWorkOrder(order) && daysUntil(order.dueDate) < 0).length;
      return {
        key: `brand-${brand.id}`,
        title: brand.shortName,
        description: `${getClient(brand.clientId)?.name || "Cliente"} / ${open} abiertas / ${overdue} vencidas`,
        orders: brandGroupOrders,
        open: overdue > 0,
        tone: overdue ? "danger" : "neutral",
      };
    })
    .filter((group) => group.orders.length);
}

function workOrderInboxGroups(orders) {
  if (state.workOrderView === "status") return buildStatusWorkOrderGroups(orders);
  if (state.workOrderView === "responsible") return buildResponsibleWorkOrderGroups(orders);
  if (state.workOrderView === "brand") return buildBrandWorkOrderGroups(orders);
  return buildPriorityWorkOrderGroups(orders);
}

function renderWorkOrderViewSwitch() {
  const views = [
    ["priority", "Prioridad"],
    ["status", "Estado"],
    ["responsible", "Responsable"],
    ["brand", "Marca"],
  ];
  return `
    <div class="view-switch" aria-label="Vista de órdenes">
      ${views
        .map(
          ([value, label]) => `
            <button class="${state.workOrderView === value ? "active" : ""}" type="button" data-workorder-view="${value}">
              ${label}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function workOrderGroupLimit(groupKey) {
  return state.workOrderGroupLimits?.[groupKey] || 10;
}

function renderWorkOrderInboxGroup(group, allBrands) {
  const limit = workOrderGroupLimit(group.key);
  const visibleOrders = group.orders.slice(0, limit);
  const hiddenCount = Math.max(0, group.orders.length - visibleOrders.length);
  const openAttr = group.open || limit > 10 ? "open" : "";
  return `
    <details class="work-order-inbox-group group-${group.tone || "neutral"}" ${openAttr}>
      <summary>
        <span class="group-summary-main">
          <strong>${escapeHtml(group.title)}</strong>
          <small>${escapeHtml(group.description || "")}</small>
        </span>
        <span class="group-count">${group.orders.length}</span>
      </summary>
      <div class="work-order-inbox-body">
        ${
          visibleOrders.length
            ? `
              <div class="compact-order-list">
                ${visibleOrders.map((order) => renderOperationOrderRow(order, allBrands)).join("")}
              </div>
              ${
                hiddenCount
                  ? `<button class="button-ghost small show-more-row" data-workorder-show-more="${escapeHtml(group.key)}">Ver ${hiddenCount} más</button>`
                  : ""
              }
            `
            : `<div class="empty compact-empty">Sin OTs en este grupo.</div>`
        }
      </div>
    </details>
  `;
}

function renderWorkOrderOperationsPanel(orders, allBrands, archivedCount = 0) {
  const groups = workOrderInboxGroups(orders);
  const visibleCount = groups.reduce((sum, group) => sum + group.orders.length, 0);
  const viewLabel = {
    priority: "Vista por prioridad",
    status: "Vista por estado",
    responsible: "Vista por responsable",
    brand: "Vista por marca",
  }[state.workOrderView || "priority"];

  return `
    <section class="panel section operations-panel inbox-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">${state.showArchivedWorkOrders ? "OTs archivadas" : viewLabel}</h2>
          <div class="small-muted">${visibleCount} OTs visibles. Solo abre el grupo que necesitas atender.</div>
        </div>
        <div class="row wrap">
          <button class="button-ghost small" data-action="toggle-archived-work-orders">
            ${state.showArchivedWorkOrders ? "Ocultar archivadas" : `Ver archivadas (${archivedCount})`}
          </button>
          <button class="button-ghost small" data-module="team">Ver tareas del equipo</button>
        </div>
      </div>
      <div class="inbox-toolbar">
        ${renderWorkOrderViewSwitch()}
        <span class="small-muted">Default: críticas abiertas, todo lo demás colapsado.</span>
      </div>
      <div class="work-order-inbox">
        ${
          groups.length
            ? groups.map((group) => renderWorkOrderInboxGroup(group, allBrands)).join("")
            : `<div class="empty compact-empty">Sin OTs en este scope</div>`
        }
      </div>
    </section>
  `;
}

function renderOperationOrderRow(order, allBrands) {
  const assignees = orderAssignees(order);
  const files = orderFiles(order);
  const urgency = workOrderUrgency(order);
  const showTimingBadge = shouldRenderWorkOrderTimingBadge(order);
  const brand = getBrand(order.brandId);
  const archived = isArchivedWorkOrder(order);
  return `
    <article class="operation-order-row compact-order-row ${order.id === state.focusedWorkOrderId ? "focused-row" : ""} ${archived ? "archived-row" : ""}">
      <button class="operation-order-main compact-order-main" data-action="view-work-order" data-id="${order.id}">
        <span class="status-dot ${urgency.cls}"></span>
        <span>
          <strong>${escapeHtml(order.id)}</strong>
          <small>${escapeHtml(order.title)}</small>
          <em>${escapeHtml(allBrands ? `${getClient(brand.clientId)?.name || "Cliente"} / ${brand.shortName}` : brand.shortName)} · ${escapeHtml(assignees.map(userName).join(", ") || "Sin responsable")}</em>
        </span>
      </button>
      <div class="operation-meta">
        ${showTimingBadge ? `<span class="badge ${urgency.cls}">${escapeHtml(urgency.label)}</span>` : ""}
        <span class="muted">${escapeHtml(formatDate(order.dueDate))}</span>
      </div>
      <div class="operation-assignees">
        <span class="badge blue">${archived ? "Archivada" : escapeHtml(workOrderStatusLabels[order.status] || order.status)}</span>
        <span class="badge neutral">${files.length} archivo${files.length === 1 ? "" : "s"}</span>
      </div>
      <div class="operation-status-control">
        <button class="button-ghost small" data-action="view-work-order" data-id="${order.id}">Ver OT</button>
      </div>
    </article>
  `;
}

function userPhaseSummaryForOrder(order, userId = currentProfileId()) {
  const phases = workOrderPhases(order).filter((phase) => phase.assignedTo === userId);
  const active = phases.filter(isActivePhase).sort((a, b) => String(a.dueDate || "9999-12-31").localeCompare(String(b.dueDate || "9999-12-31")));
  const phase = active[0] || phases[0];
  if (!phase) return "Participas en la orden";
  return `${phase.title || phaseStatusLabel(phase.status)} · ${phaseStatusLabel(phase.status)}${phase.dueDate ? ` · ${formatDate(phase.dueDate)}` : ""}`;
}

function renderMyWorkOrderRow(order) {
  const brand = getBrand(order.brandId);
  const urgency = workOrderUrgency(order);
  const showTimingBadge = shouldRenderWorkOrderTimingBadge(order);
  return `
    <article class="operation-order-row compact-order-row my-order-row" data-action="view-work-order" data-id="${escapeHtml(order.id)}">
      <button class="operation-order-main compact-order-main" data-action="view-work-order" data-id="${escapeHtml(order.id)}">
        <span class="status-dot ${urgency.cls}"></span>
        <span>
          <strong>${escapeHtml(order.id)}</strong>
          <small>${escapeHtml(order.title)}</small>
          <em>${escapeHtml(brand.shortName)} · ${escapeHtml(userPhaseSummaryForOrder(order))}</em>
        </span>
      </button>
      <div class="operation-meta">
        ${showTimingBadge ? `<span class="badge ${urgency.cls}">${escapeHtml(urgency.label)}</span>` : ""}
        <span class="badge blue">${escapeHtml(workOrderStatusLabels[order.status] || order.status)}</span>
        <span class="muted">${escapeHtml(formatDate(order.dueDate))}</span>
      </div>
      <div class="operation-status-control">
        <button class="button-ghost small" data-action="view-work-order" data-id="${escapeHtml(order.id)}">Abrir detalle</button>
      </div>
    </article>
  `;
}

function renderMyWorkOrdersWorkspace() {
  const sourceOrders = brandOrders(state.currentBrandId);
  const orders = userParticipatingOrders(sourceOrders);
  const query = (state.workOrderFilters?.search || "").trim().toLowerCase();
  const filtered = query
    ? orders.filter((order) => {
        const brand = getBrand(order.brandId);
        return [order.id, order.title, brand.shortName, brand.name, userPhaseSummaryForOrder(order)].join(" ").toLowerCase().includes(query);
      })
    : orders;
  const detailPanel = renderWorkOrderDetailPanel(selectedViewingOrder());

  return `
    <section class="section">
      <section class="panel brand-hero">
        <div>
          <div class="hero-title">
            <h2>Mis órdenes</h2>
            <span class="badge blue">${filtered.length} visibles</span>
          </div>
          <p class="muted">Solo órdenes donde participas, tienes fases asignadas o fuiste creador.</p>
        </div>
      </section>
      <section class="panel section work-order-filter-panel">
        <div class="field search-field">
          <label>Buscar</label>
          <input class="input" data-workorder-filter="search" placeholder="Buscar por código, título, marca o fase" value="${escapeHtml(state.workOrderFilters?.search || "")}" />
        </div>
      </section>
      <section class="panel section operations-panel inbox-panel">
        <div class="section-header">
          <div>
            <h2 class="section-title">Trabajo asignado a mí</h2>
            <div class="small-muted">Abre la OT para revisar o completar tus fases permitidas.</div>
          </div>
        </div>
        <div class="operations-list">
          ${filtered.length ? filtered.map(renderMyWorkOrderRow).join("") : `<div class="empty compact-empty">No tienes órdenes relacionadas en este filtro.</div>`}
        </div>
      </section>
      ${detailPanel}
    </section>
  `;
}

function renderOrderCard(order) {
  const assignees = orderAssignees(order);
  const files = orderFiles(order);
  const urgency = workOrderUrgency(order);
  const isFocused = order.id === state.focusedWorkOrderId;
  const canManage = canManageWorkOrders();
  const canManageUrgencyFlag = canManageUrgency();
  const canArchive = canArchiveWorkOrders();
  const canUploadMaterials = canUploadWorkOrderMaterials(order);
  const archived = isArchivedWorkOrder(order);
  const nextStatus = archived || hasConfirmedNoWorkOrderPhases(order) ? null : nextWorkOrderStatus(order);
  const parsedDescription = splitWorkOrderDescription(order.description || "");
  return `
    <div class="mini-card ${isFocused ? "focused-card" : ""}" data-order-card="${escapeHtml(order.id)}">
      <div class="row between">
        <span class="badge">${order.id}</span>
        <span class="badge ${isUrgentWorkOrder(order) ? "red" : order.priority === "high" ? "red" : order.priority === "medium" ? "amber" : "green"}">${isUrgentWorkOrder(order) ? "Urgente" : workOrderPriorityLabels[order.priority] || order.priority}</span>
      </div>
      <strong>${order.title}</strong>
      <span class="muted">${assignees.map((userId) => userName(userId)).join(", ") || "Sin asignar"} / ${formatDate(order.dueDate)}</span>
      <div class="row wrap">
        <span class="badge ${urgency.cls}">${urgency.label}</span>
        <span class="badge">${workOrderCategoryLabels[order.category] || order.category}</span>
      </div>
      <p class="muted">${parsedDescription.description || "Sin descripcion"}</p>
      ${
        parsedDescription.subtasks.length || parsedDescription.materialChanges.length
          ? `
            <div class="work-order-extras">
              ${
                parsedDescription.subtasks.length
                  ? `<span class="badge green">${parsedDescription.subtasks.length} subtarea${parsedDescription.subtasks.length === 1 ? "" : "s"}</span>`
                  : ""
              }
              ${
                parsedDescription.materialChanges.length
                  ? `<span class="badge amber">${parsedDescription.materialChanges.length} cambio${parsedDescription.materialChanges.length === 1 ? "" : "s"} de material</span>`
                  : ""
              }
            </div>
            ${
              parsedDescription.subtasks.length
                ? `
                  <ul class="subtask-list">
                    ${parsedDescription.subtasks
                      .slice(0, 3)
                      .map((task) => `<li>${escapeHtml(task)}</li>`)
                      .join("")}
                  </ul>
                `
                : ""
            }
          `
          : ""
      }
      <div class="assignee-row">
        ${assignees
          .map(
            (userId) => `
              <span class="avatar-pill" title="${userEmail(userId)}">${userName(userId)}</span>
            `,
          )
          .join("")}
      </div>
      ${
        files.length
          ? `
            <div class="file-list">
              ${files
                .map((file, index) => renderWorkOrderFileChip(order, file, index))
                .join("")}
            </div>
          `
          : `<span class="muted">Sin archivos adjuntos</span>`
      }
      ${
        canUploadMaterials
          ? `
            <div class="material-upload-box">
              <label>Materiales para aprobación o cambios</label>
              <div class="material-upload-row">
                <input class="input file-input" data-material-files="${order.id}" type="file" multiple />
                <button class="button-ghost small" data-action="upload-order-materials" data-id="${order.id}">Subir</button>
              </div>
            </div>
          `
          : ""
      }
      <div class="row wrap">
        <button class="button small" data-action="view-work-order" data-id="${order.id}">Ver detalle</button>
        ${order.notifyOnEmail ? `<span class="badge blue">Email activo</span>` : `<span class="badge">Sin email</span>`}
        ${canManageUrgencyFlag && !archived ? `<button class="${isUrgentWorkOrder(order) ? "button-ghost" : "button-danger"} small" data-action="${isUrgentWorkOrder(order) ? "unmark-work-order-urgent" : "mark-work-order-urgent"}" data-id="${order.id}">${isUrgentWorkOrder(order) ? "Quitar urgencia" : "Marcar urgencia"}</button>` : ""}
        ${
          canManage
            ? `
              <button class="button-ghost small" data-action="edit-work-order" data-id="${order.id}">Editar</button>
              ${
                nextStatus
                  ? `<button class="button-ghost small" data-action="advance-order" data-id="${order.id}">Avanzar a ${workOrderStatusLabels[nextStatus]}</button>`
                  : ""
              }
              <button class="button-danger small" data-action="send-urgent-alert" data-id="${order.id}">Enviar alerta</button>
            `
            : ""
        }
        ${
          canArchive
            ? archived
              ? `<button class="button-ghost small" data-action="unarchive-work-order" data-id="${order.id}">Restaurar</button>`
              : `<button class="button-ghost small" data-action="archive-work-order" data-id="${order.id}">Archivar</button>`
            : `<span class="badge amber">Lectura</span>`
        }
      </div>
      ${
        order.linkedContentId
          ? `<button class="button-ghost small" data-content="${order.linkedContentId}">Ver pieza vinculada</button>`
          : ""
      }
    </div>
  `;
}

function renderWorkOrdersHeader(allBrands) {
  return `
    <section class="dashboard-command work-orders-command">
      <div>
        <span class="eyebrow">Operación diaria</span>
        <h2>Órdenes de trabajo</h2>
        <p>Gestiona, filtra y da seguimiento a las solicitudes activas.</p>
      </div>
      <div class="dashboard-command-actions">
        <select class="brand-select js-brand-select" aria-label="Cliente o marca">
          ${renderBrandOptions(state.currentBrandId)}
        </select>
        <button class="button" data-action="open-create-work-order">+ Crear OT</button>
        <button class="button-ghost" data-action="toggle-archived-work-orders">${state.showArchivedWorkOrders ? "Ocultar archivadas" : "Ver archivadas"}</button>
        <button class="button-ghost" data-module="calendar">Ver calendario</button>
      </div>
    </section>
  `;
}

function renderBrandEmailRecipientManager() {
  const manageableBrands = brands.filter((brand) => canUserAccessBrand(users.find((user) => user.id === dataState.session?.user?.id), brand.id) || !isSupabaseMode());
  const selectableBrands = manageableBrands.length ? manageableBrands : brands;
  const selectedBrandId = state.notificationBrandId && selectableBrands.some((brand) => brand.id === state.notificationBrandId)
    ? state.notificationBrandId
    : selectableBrands[0]?.id || "";
  state.notificationBrandId = selectedBrandId;

  const selectedBrand = brands.find((brand) => brand.id === selectedBrandId);
  const selectedRecipientIds = new Set(brandEmailRecipientIds(selectedBrandId));
  const selectedRecipients = configuredBrandEmailRecipientUsers(selectedBrandId);
  const canEditRecipients = canManageWorkOrders() || isSystemAdmin();
  const internalRecipients = internalUsers().filter((user) => user.email);

  return `
    <section class="panel section brand-email-manager">
      <div class="section-header">
        <div>
          <h2 class="section-title">Destinatarios por marca</h2>
          <div class="small-muted">Define quién recibe correos cuando se crea una OT de cada marca. Esto es independiente de los responsables operativos.</div>
        </div>
        <span class="badge ${selectedRecipients.length ? "blue" : "amber"}">
          ${selectedRecipients.length ? `${selectedRecipients.length} configurados` : "Usa responsables"}
        </span>
      </div>
      ${
        !dataState.brandNotificationRecipientsReady && isSupabaseMode()
          ? `<div class="admin-note">Para guardar esta configuración, ejecuta primero el SQL <strong>supabase/patch_brand_notification_recipients.sql</strong> en Supabase.</div>`
          : ""
      }
      <div class="recipient-manager-grid">
        <div class="field">
          <label>Marca</label>
          <select class="input" id="brand-email-recipient-brand">
            ${selectableBrands
              .map((brand) => {
                const client = getClient(brand.clientId);
                return `<option value="${brand.id}" ${brand.id === selectedBrandId ? "selected" : ""}>${escapeHtml(client?.name ? `${client.name} / ${brand.name}` : brand.name)}</option>`;
              })
              .join("")}
          </select>
          <div class="field-help">${selectedBrand ? escapeHtml(brandEmailRecipientSummary(selectedBrand.id)) : "Selecciona una marca para editar su lista."}</div>
        </div>
        <div class="recipient-summary-box">
          <strong>Reciben email</strong>
          <div class="recipient-chip-row">
            ${
              selectedRecipients.length
                ? selectedRecipients.map((user) => `<span class="badge blue">${escapeHtml(user.name)}</span>`).join("")
                : `<span class="badge amber">Sin lista fija</span><span class="muted">Se usaran los responsables seleccionados en la OT.</span>`
            }
          </div>
        </div>
      </div>
      <div class="recipient-checkbox-grid">
        ${internalRecipients
          .map(
            (user) => `
              <label class="recipient-option">
                <input type="checkbox" data-brand-email-recipient value="${user.id}" ${selectedRecipientIds.has(user.id) ? "checked" : ""} ${canEditRecipients ? "" : "disabled"} />
                <span>
                  <strong>${escapeHtml(user.name)}</strong>
                  <small>${escapeHtml(roleLabels[user.role] || user.role)} · ${escapeHtml(user.email || "sin correo")}</small>
                </span>
              </label>
            `,
          )
          .join("") || `<div class="empty compact-empty">No hay usuarios internos activos.</div>`}
      </div>
      <div class="row wrap form-actions">
        <button class="button" data-action="save-brand-email-recipients" ${canEditRecipients && selectedBrandId ? "" : "disabled"}>Guardar destinatarios</button>
        <button class="button-ghost" data-action="clear-brand-email-recipients" ${canEditRecipients && selectedBrandId ? "" : "disabled"}>Usar responsables de cada OT</button>
      </div>
    </section>
  `;
}

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function productionPlannerPeriodLabel(month = state.productionPlannerMonth, year = state.productionPlannerYear) {
  return `${monthNames[Number(month || 1) - 1] || "Mes"} ${year || 2026}`;
}

function productionPlannerStatusClass(status = "") {
  const normalized = normalizeRoleKey(status);
  if (["aprobado", "programado", "producido"].includes(normalized)) return "green";
  if (["en revision", "en proceso"].includes(normalized)) return "blue";
  if (["pausado", "cancelado"].includes(normalized)) return "red";
  return "amber";
}

function saveProductionPlannerItems() {
  if (isSupabaseMode()) return;
  localStorage.setItem("lumen_production_planner_items_v1", JSON.stringify(productionPlannerItems));
}

function currentProductionPlannerItems({ includeArchived = state.productionPlannerShowArchived } = {}) {
  const filters = state.productionPlannerFilters;
  return productionPlannerItems
    .filter((item) => Number(item.month) === Number(state.productionPlannerMonth) && Number(item.year) === Number(state.productionPlannerYear))
    .filter((item) => includeArchived || !item.archivedAt)
    .filter((item) => productionPlannerMatchesSearch(item, filters.search))
    .filter((item) => !filters.brand || item.brand === filters.brand)
    .filter((item) => !filters.medium || item.medium === filters.medium)
    .filter((item) => !filters.status || item.status === filters.status)
    .filter((item) => !filters.accountOwner || item.accountOwner === filters.accountOwner)
    .filter((item) => !filters.digitalOwner || item.digitalOwner === filters.digitalOwner)
    .filter((item) => !filters.responsible || productionPlannerResponsibleNames(item).includes(filters.responsible))
    .sort((a, b) => String(a.productionDate || "9999-12-31").localeCompare(String(b.productionDate || "9999-12-31")) || a.brand.localeCompare(b.brand));
}

function productionPlannerPeriodItems() {
  return productionPlannerItems.filter(
    (item) => Number(item.month) === Number(state.productionPlannerMonth) && Number(item.year) === Number(state.productionPlannerYear),
  );
}

function productionPlannerSummaryLine() {
  const periodItems = productionPlannerPeriodItems();
  const activeItems = periodItems.filter((item) => !item.archivedAt);
  const producedItems = activeItems.filter((item) => normalizeRoleKey(item.status) === "producido");
  const archivedItems = periodItems.filter((item) => item.archivedAt);
  const nextProduction = activeItems
    .filter((item) => item.productionDate)
    .sort((a, b) => String(a.productionDate).localeCompare(String(b.productionDate)))[0];
  return `${activeItems.length} producciones activas · ${producedItems.length} producidas · ${archivedItems.length} archivadas · Próxima producción: ${
    nextProduction ? formatDate(nextProduction.productionDate) : "Sin fecha"
  }`;
}

function productionPlannerFilterOptions(field) {
  return [...new Set(productionPlannerItems
    .filter((item) => Number(item.month) === Number(state.productionPlannerMonth) && Number(item.year) === Number(state.productionPlannerYear))
    .map((item) => item[field])
    .filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)));
}

function normalizePlannerSearchValue(value = "") {
  return plainText(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function userIdsMatchingPlannerOwner(value = "") {
  const query = normalizePlannerSearchValue(value);
  if (!query) return [];
  return internalUsers()
    .filter((user) => {
      const name = normalizePlannerSearchValue(user.name);
      const email = normalizePlannerSearchValue(user.email);
      return name === query || email === query || name.includes(query) || query.includes(name);
    })
    .map((user) => user.id);
}

function productionPlannerResponsibleIds(item = {}) {
  return uniqueUserIds([
    ...userIdsMatchingPlannerOwner(item.accountOwner),
    ...userIdsMatchingPlannerOwner(item.digitalOwner),
    ...(item.additionalResponsibleIds || []),
  ]);
}

function productionPlannerResponsibleNames(item = {}) {
  return productionPlannerResponsibleIds(item).map(userName).filter(Boolean);
}

function productionPlannerResponsibleSearchText(item = {}) {
  return [
    item.accountOwner,
    item.digitalOwner,
    ...productionPlannerResponsibleNames(item),
    ...(item.additionalResponsibleIds || []).map(userEmail),
  ].filter(Boolean).join(" ");
}

function productionPlannerBrandCounts() {
  return productionPlannerPeriodItems()
    .filter((item) => state.productionPlannerShowArchived || !item.archivedAt)
    .reduce((counts, item) => {
      const brand = item.brand || "Sin marca";
      counts.set(brand, (counts.get(brand) || 0) + 1);
      return counts;
    }, new Map());
}

function productionPlannerVisibleBrandOptions() {
  return [...productionPlannerBrandCounts().entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function productionPlannerMatchesSearch(item, search = "") {
  const query = normalizePlannerSearchValue(search);
  if (!query) return true;
  const haystack = normalizePlannerSearchValue([
    item.brand,
    item.medium,
    item.deliverables,
    item.accountOwner,
    item.digitalOwner,
    productionPlannerResponsibleSearchText(item),
    item.notes,
  ].filter(Boolean).join(" "));
  return haystack.includes(query);
}

function renderProductionPlannerResponsibleChips(item = {}) {
  const names = productionPlannerResponsibleNames(item);
  if (!names.length) return `<span class="muted">—</span>`;
  return `
    <div class="planner-chip-list">
      ${names.map((name) => `<span class="planner-user-chip">${escapeHtml(name)}</span>`).join("")}
    </div>
  `;
}

function productionPlannerPillClass(value = "", prefix = "status") {
  const normalized = normalizeRoleKey(value || "pendiente").replace(/\s+/g, "-");
  if (prefix === "medium") {
    if (normalized.includes("meta")) return "production-pill--meta";
    if (normalized.includes("tiktok")) return "production-pill--tiktok";
    if (normalized.includes("diseno") || normalized.includes("diseño")) return "production-pill--design";
    return "production-pill--medium-default";
  }
  if (["modelo", "vendedor", "no", "por-definir"].includes(normalized)) return `production-pill--need-${normalized}`;
  if (["en-revision", "aprobado", "pendiente", "no-aplica"].includes(normalized)) return `production-pill--matrix-${normalized}`;
  if (["en-proceso", "en-revision", "aprobado", "programado", "producido", "pausado", "cancelado", "pendiente"].includes(normalized)) {
    return `production-pill--${normalized}`;
  }
  return `production-pill--${prefix}-default`;
}

function renderProductionPlannerPill(value, prefix = "status", fallback = "Pendiente") {
  const label = value || fallback;
  return `<span class="production-pill ${productionPlannerPillClass(label, prefix)}">${escapeHtml(label)}</span>`;
}

function renderProductionPlannerDateStack(item = {}) {
  return `
    <div class="production-date-stack">
      <span><strong>Matriz</strong>${escapeHtml(item.rawMatrixDueDate ? formatDate(item.rawMatrixDueDate) : "Sin fecha")}</span>
      <span><strong>Producción</strong>${escapeHtml(item.productionDate ? formatDate(item.productionDate) : "Sin fecha")}</span>
    </div>
  `;
}

function renderProductionPlannerOwnerChips(item = {}) {
  const additionalNames = productionPlannerResponsibleNames(item).filter(
    (name) => ![item.accountOwner, item.digitalOwner].filter(Boolean).some((owner) => normalizePlannerSearchValue(owner) === normalizePlannerSearchValue(name)),
  );
  const visibleAdditional = additionalNames.slice(0, 2);
  return `
    <div class="production-assignee-chips">
      ${item.accountOwner ? `<span class="production-assignee-chip"><small>Cuentas</small>${escapeHtml(item.accountOwner)}</span>` : ""}
      ${item.digitalOwner ? `<span class="production-assignee-chip"><small>Digital</small>${escapeHtml(item.digitalOwner)}</span>` : ""}
      ${visibleAdditional.map((name) => `<span class="production-assignee-chip is-team"><small>Equipo</small>${escapeHtml(name)}</span>`).join("")}
      ${additionalNames.length > visibleAdditional.length ? `<span class="production-assignee-chip is-more">+${additionalNames.length - visibleAdditional.length} más</span>` : ""}
      ${!item.accountOwner && !item.digitalOwner && !additionalNames.length ? `<span class="muted">Sin responsables</span>` : ""}
    </div>
  `;
}

function renderProductionPlannerAssigneeOptions(selectedIds = []) {
  const selected = new Set(selectedIds || []);
  const options = internalUsers().sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return options.length
    ? options.map((user) => `
        <label class="planner-assignee-option">
          <input type="checkbox" data-production-planner-assignee value="${escapeHtml(user.id)}" ${selected.has(user.id) ? "checked" : ""} />
          <span>
            <strong>${escapeHtml(user.name)}</strong>
            <small>${escapeHtml(roleLabels[user.role] || user.role)} · ${escapeHtml(user.email || "sin email")}</small>
          </span>
        </label>
      `).join("")
    : `<div class="empty compact-empty">No hay usuarios internos activos.</div>`;
}

function buildProductionPlannerUrl(month = state.productionPlannerMonth, year = state.productionPlannerYear) {
  const url = new URL(getAppBaseUrl());
  url.searchParams.set("module", "production-planner");
  url.searchParams.set("month", month);
  url.searchParams.set("year", year);
  return url.toString();
}

function buildProductionPlannerAssignmentEmail(item, eventLabel = "Nueva producción asignada") {
  const plannerUrl = buildProductionPlannerUrl(item.month, item.year);
  return `
    <div style="margin:0;background:#f6f6f3;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #deded8;border-radius:14px;overflow:hidden;">
        <div style="padding:26px 28px 20px;border-left:7px solid #49ee8c;">
          <div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#176339;margin-bottom:10px;">${escapeHtml(eventLabel)}</div>
          <h1 style="margin:0 0 8px;font-size:27px;line-height:1.15;color:#2d2d2d;">${escapeHtml(item.brand || "Producción")}</h1>
          <p style="margin:0;color:#5f6760;font-size:17px;line-height:1.45;">${escapeHtml(item.deliverables || item.medium || "Sin entregables especificados")}</p>
        </div>
        <div style="padding:0 28px 26px;">
          <table role="presentation" style="width:100%;border-collapse:collapse;margin:10px 0 22px;">
            ${[
              ["Periodo", productionPlannerPeriodLabel(item.month, item.year)],
              ["Medio", item.medium || "Sin medio"],
              ["Entregables", item.deliverables || "Sin entregables"],
              ["Matriz en crudo", item.rawMatrixStatus || "Sin estado"],
              ["Fecha entrega matriz", item.rawMatrixDueDate ? formatDate(item.rawMatrixDueDate) : "Sin fecha"],
              ["Fecha producción", item.productionDate ? formatDate(item.productionDate) : "Sin fecha"],
              ["Estado", item.status || "Pendiente"],
              ["Responsable cuentas", item.accountOwner || "Sin asignar"],
              ["Responsable digital", item.digitalOwner || "Sin asignar"],
              ["Equipo involucrado", productionPlannerResponsibleNames(item).join(", ") || "Sin adicionales"],
            ].map(([label, value]) => `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #ecece8;color:#6b726c;">${escapeHtml(label)}</td>
                <td style="padding:10px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">${escapeHtml(value)}</td>
              </tr>
            `).join("")}
          </table>
          ${item.notes ? `<div style="margin-bottom:22px;border:1px solid #ecece8;border-radius:12px;padding:14px 16px;background:#fafaf8;"><strong>Notas:</strong> ${escapeHtml(item.notes)}</div>` : ""}
          <a href="${escapeHtml(plannerUrl)}" style="display:inline-block;background:#2d2d2d;color:#ffffff;text-decoration:none;border-radius:10px;padding:14px 18px;font-size:16px;font-weight:800;">Abrir Planificador de producción</a>
        </div>
      </div>
    </div>
  `;
}

async function queueProductionPlannerAssignmentEmails(item, recipientIds = [], eventLabel = "Nueva producción asignada") {
  if (!isSupabaseMode()) return { count: 0, error: null };
  const currentUserId = dataState.session?.user?.id || "";
  const recipients = dedupeUsersByEmail(
    internalUsers().filter((user) => recipientIds.includes(user.id) && user.id !== currentUserId && user.email),
  );
  if (!recipients.length) return { count: 0, error: null };

  const { error } = await supabaseClient.from("email_notifications").insert(
    recipients.map((user) => ({
      brand_id: null,
      work_order_id: null,
      recipient_user_id: user.id,
      recipient_email: user.email,
      notification_type: productionPlannerNotificationType,
      subject: `${eventLabel}: ${item.brand || "Producción"} · ${item.deliverables || item.medium || productionPlannerPeriodLabel(item.month, item.year)}`,
      html_body: buildProductionPlannerAssignmentEmail(item, eventLabel),
      status: "queued",
      scheduled_for: new Date().toISOString(),
    })),
  );
  if (error) {
    console.warn("No se pudo encolar email production_assigned.", {
      plannerItemId: item.id,
      recipients: recipients.map((user) => user.id),
      message: error.message,
    });
  }
  return { count: recipients.length, error };
}

function renderProductionPlannerSelectOptions(options, activeValue = "", emptyLabel = "Todos") {
  return `
    <option value="">${escapeHtml(emptyLabel)}</option>
    ${options.map((option) => `<option value="${escapeHtml(option)}" ${option === activeValue ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
  `;
}

function renderProductionPlanner() {
  if (!canAccessProductionPlanner()) {
    return `<section class="panel section"><h2 class="section-title">Planificador de producción</h2><p class="muted">No tienes acceso a esta herramienta.</p></section>`;
  }
  const items = currentProductionPlannerItems();
  const totalPeriodItems = productionPlannerPeriodItems().filter((item) => state.productionPlannerShowArchived || !item.archivedAt).length;
  const archivedCount = currentProductionPlannerItems({ includeArchived: true }).filter((item) => item.archivedAt).length;
  const editingItem = productionPlannerItems.find((item) => item.id === state.productionPlannerEditingId);
  const brandOptions = productionPlannerVisibleBrandOptions();
  const responsibleOptions = [...new Set(productionPlannerPeriodItems().flatMap(productionPlannerResponsibleNames))].sort((a, b) => a.localeCompare(b));
  return `
    <section class="production-planner-workspace">
      <div class="production-planner-toolbar">
        <div>
          <h2 class="section-title">Planificador de producción</h2>
          <div class="small-muted">Seguimiento mensual de marcas, entregables, matriz y producción.</div>
        </div>
        <div class="production-planner-period-controls">
          <span class="badge blue">${escapeHtml(productionPlannerPeriodLabel())}</span>
          <label>
            <span>Mes</span>
            <select class="input compact-input" data-production-planner-period="month">
              ${monthNames.map((name, index) => `<option value="${index + 1}" ${Number(state.productionPlannerMonth) === index + 1 ? "selected" : ""}>${name}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Año</span>
            <input class="input compact-input year-input" type="number" min="2026" step="1" data-production-planner-period="year" value="${escapeHtml(state.productionPlannerYear)}" />
          </label>
          <button class="button-ghost small" data-action="duplicate-production-planner-month">Duplicar mes anterior</button>
          <button class="button small" data-action="new-production-planner-item">Agregar producción</button>
        </div>
      </div>
      ${!dataState.productionPlannerReady && isSupabaseMode() ? `<div class="auth-error">Falta ejecutar <strong>supabase/patch_production_planner.sql</strong> para activar esta tabla en Supabase.</div>` : ""}
      <div class="production-planner-summary-line">${escapeHtml(productionPlannerSummaryLine())}</div>
      <div class="planner-brand-chips" aria-label="Filtro rápido por marca">
        <button class="quick-chip ${state.productionPlannerFilters.brand ? "" : "active"}" data-production-planner-brand-filter="">Todas <span>${totalPeriodItems}</span></button>
        ${brandOptions.map(([brand, count]) => `
          <button class="quick-chip ${state.productionPlannerFilters.brand === brand ? "active" : ""}" data-production-planner-brand-filter="${escapeHtml(brand)}">
            ${escapeHtml(brand)} <span>${count}</span>
          </button>
        `).join("")}
      </div>
      <section class="production-planner-filter-panel">
        <div class="production-planner-filterbar">
          <div class="planner-search-field">
            <input class="input" aria-label="Buscar producción" data-production-planner-filter="search" value="${escapeHtml(state.productionPlannerFilters.search)}" placeholder="Buscar producción, marca, medio o responsable..." />
          </div>
          <div class="planner-filter-control">
            <select class="input" aria-label="Marca" data-production-planner-filter="brand">${renderProductionPlannerSelectOptions(productionPlannerFilterOptions("brand"), state.productionPlannerFilters.brand, "Marca")}</select>
          </div>
          <div class="planner-filter-control">
            <select class="input" aria-label="Medio" data-production-planner-filter="medium">${renderProductionPlannerSelectOptions(productionPlannerFilterOptions("medium"), state.productionPlannerFilters.medium, "Medio")}</select>
          </div>
          <div class="planner-filter-control">
            <select class="input" aria-label="Estado" data-production-planner-filter="status">${renderProductionPlannerSelectOptions(productionPlannerStatusOptions, state.productionPlannerFilters.status, "Estado")}</select>
          </div>
          <div class="planner-filter-control">
            <select class="input" aria-label="Responsable cuentas" data-production-planner-filter="accountOwner">${renderProductionPlannerSelectOptions(productionPlannerFilterOptions("accountOwner"), state.productionPlannerFilters.accountOwner, "Resp. cuentas")}</select>
          </div>
          <div class="planner-filter-control">
            <select class="input" aria-label="Responsable digital" data-production-planner-filter="digitalOwner">${renderProductionPlannerSelectOptions(productionPlannerFilterOptions("digitalOwner"), state.productionPlannerFilters.digitalOwner, "Resp. digital")}</select>
          </div>
          <div class="planner-filter-control">
            <select class="input" aria-label="Responsable" data-production-planner-filter="responsible">${renderProductionPlannerSelectOptions(responsibleOptions, state.productionPlannerFilters.responsible, "Responsable")}</select>
          </div>
          <label class="checkbox-line planner-archive-toggle">
            <input type="checkbox" data-production-planner-archive-toggle ${state.productionPlannerShowArchived ? "checked" : ""} />
            Ver archivadas (${archivedCount})
          </label>
          <button class="button-ghost small planner-clear-filters" data-action="clear-production-planner-filters">Limpiar filtros</button>
        </div>
        <div class="planner-result-count">Mostrando ${items.length} de ${totalPeriodItems} producciones</div>
      </section>
      <section class="panel production-planner-table-panel">
        <div class="table-wrap production-planner-table-wrap">
          <table class="compact-table production-planner-table">
            <thead>
              <tr>
                <th>Marca / Producción</th>
                <th>Canal</th>
                <th>Entregables</th>
                <th>Necesidad</th>
                <th>Matriz</th>
                <th>Fechas</th>
                <th>Estado</th>
                <th>Responsables</th>
                <th>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${
                items.length
                  ? items.map(renderProductionPlannerRow).join("")
                  : `<tr><td colspan="10">No hay producciones para ${escapeHtml(productionPlannerPeriodLabel())}.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
    </section>
    ${editingItem || state.productionPlannerEditingId === "new" ? renderProductionPlannerModal(editingItem) : ""}
  `;
}

function renderProductionPlannerRow(item) {
  return `
    <tr class="production-planner-row ${item.archivedAt ? "archived-row" : ""}" data-action="edit-production-planner-item" data-id="${escapeHtml(item.id)}">
      <td>
        <div class="production-brand-cell">
          <strong class="production-brand-name">${escapeHtml(item.brand || "Sin marca")}</strong>
          <span class="production-brand-meta">${escapeHtml(productionPlannerPeriodLabel(item.month, item.year))}</span>
        </div>
      </td>
      <td>${renderProductionPlannerPill(item.medium, "medium", "Sin medio")}</td>
      <td><div class="production-deliverables-cell">${escapeHtml(item.deliverables || "Sin entregables")}</div></td>
      <td>${renderProductionPlannerPill(item.talentRequirement, "need", "Por definir")}</td>
      <td>${renderProductionPlannerPill(item.rawMatrixStatus, "matrix", "Pendiente")}</td>
      <td>${renderProductionPlannerDateStack(item)}</td>
      <td>${renderProductionPlannerPill(item.status, "status", "Pendiente")}</td>
      <td>${renderProductionPlannerOwnerChips(item)}</td>
      <td><div class="production-note-cell" title="${escapeHtml(item.notes || "")}">${escapeHtml(item.notes || "Sin notas")}</div></td>
      <td>
        <div class="production-row-actions">
          <button class="button-ghost small" data-action="edit-production-planner-item" data-id="${escapeHtml(item.id)}">Editar</button>
          <button class="button-ghost small" data-action="${item.archivedAt ? "restore-production-planner-item" : "archive-production-planner-item"}" data-id="${escapeHtml(item.id)}">${item.archivedAt ? "Restaurar" : "Archivar"}</button>
        </div>
      </td>
    </tr>
  `;
}

function renderProductionPlannerModal(item) {
  const isNew = !item;
  const draft = item || {
    id: "new",
    month: state.productionPlannerMonth,
    year: state.productionPlannerYear,
    brand: "",
    medium: "",
    deliverables: "",
    talentRequirement: "Por definir",
    rawMatrixStatus: "Pendiente",
    rawMatrixDueDate: "",
    productionDate: "",
    status: "Pendiente",
    accountOwner: "",
    digitalOwner: "",
    additionalResponsibleIds: [],
    notes: "",
  };
  return `
    <div class="modal-backdrop" data-action="cancel-production-planner-edit" aria-hidden="true"></div>
    <aside class="modal-panel production-planner-modal" role="dialog" aria-modal="true" aria-label="${isNew ? "Agregar producción" : "Editar producción"}">
      <button class="modal-close-button" type="button" data-action="cancel-production-planner-edit" aria-label="Cerrar">×</button>
      <section class="panel section">
        <div class="section-header">
          <div>
            <h2 class="section-title">${isNew ? "Agregar producción" : "Editar producción"}</h2>
            <div class="small-muted">${escapeHtml(productionPlannerPeriodLabel(draft.month, draft.year))}</div>
          </div>
          <span class="badge blue">Planificador</span>
        </div>
        <div class="form-grid">
          <div class="field">
            <label>Marca</label>
            <input class="input" id="planner-brand" value="${escapeHtml(draft.brand)}" placeholder="Volkswagen" />
          </div>
          <div class="field">
            <label>Medio</label>
            <input class="input" id="planner-medium" value="${escapeHtml(draft.medium)}" placeholder="Meta, TikTok..." />
          </div>
          <div class="field">
            <label>Entregables</label>
            <input class="input" id="planner-deliverables" value="${escapeHtml(draft.deliverables)}" placeholder="10 videos" />
          </div>
          <div class="field">
            <label>¿Necesita modelo/vendedor?</label>
            <select class="input" id="planner-talent-requirement">${renderProductionPlannerSelectOptions(productionPlannerTalentOptions, draft.talentRequirement, "Seleccionar")}</select>
          </div>
          <div class="field">
            <label>Matriz en crudo</label>
            <select class="input" id="planner-raw-matrix-status">${renderProductionPlannerSelectOptions(productionPlannerMatrixStatusOptions, draft.rawMatrixStatus, "Seleccionar")}</select>
          </div>
          <div class="field">
            <label>Fecha entrega matriz en crudo</label>
            <input class="input" id="planner-raw-matrix-due-date" type="date" value="${escapeHtml(draft.rawMatrixDueDate || "")}" />
          </div>
          <div class="field">
            <label>Fecha de producción</label>
            <input class="input" id="planner-production-date" type="date" value="${escapeHtml(draft.productionDate || "")}" />
          </div>
          <div class="field">
            <label>Estado</label>
            <select class="input" id="planner-status">${renderProductionPlannerSelectOptions(productionPlannerStatusOptions, draft.status, "Seleccionar")}</select>
          </div>
          <div class="field">
            <label>Responsable cuentas</label>
            <input class="input" id="planner-account-owner" value="${escapeHtml(draft.accountOwner)}" />
          </div>
          <div class="field">
            <label>Responsable digital</label>
            <input class="input" id="planner-digital-owner" value="${escapeHtml(draft.digitalOwner)}" />
          </div>
          <div class="field full">
            <label>Equipo involucrado / Responsables adicionales</label>
            <div class="planner-assignee-grid">
              ${renderProductionPlannerAssigneeOptions(draft.additionalResponsibleIds || [])}
            </div>
            <div class="field-help">Selecciona solo personas involucradas. No se duplican si tambien aparecen en cuentas o digital.</div>
          </div>
          <div class="field full">
            <label>Notas</label>
            <textarea class="textarea" id="planner-notes">${escapeHtml(draft.notes)}</textarea>
          </div>
        </div>
        <div class="row wrap">
          <button class="button" data-action="save-production-planner-item" data-id="${escapeHtml(draft.id)}">${isNew ? "Guardar" : "Guardar cambios"}</button>
          ${
            isNew
              ? ""
              : `<button class="button-ghost" data-action="${draft.archivedAt ? "restore-production-planner-item" : "archive-production-planner-item"}" data-id="${escapeHtml(draft.id)}">${draft.archivedAt ? "Restaurar" : "Archivar"}</button>`
          }
          <button class="button-ghost" data-action="cancel-production-planner-edit">Cancelar</button>
        </div>
      </section>
    </aside>
  `;
}

const notificationRuleTypeMap = {
  assignment: ["assignment"],
  "deadline-24h": ["deadline_24h"],
  "work-order-edits": ["status_change", "daily_digest"],
  "phase-assignment": ["assignment", "phase_completed"],
  "urgent-alert": ["status_change"],
  overdue: ["overdue"],
  "weekly-digest": ["weekly_digest"],
  "daily-activity-digest": ["daily_digest"],
};

function normalizeEmailStatus(value) {
  return String(value || "queued").toLowerCase();
}

function emailNotificationSummary(types = []) {
  const typeSet = new Set(types.filter(Boolean));
  const rows = typeSet.size ? emailNotifications.filter((item) => typeSet.has(item.notificationType)) : emailNotifications;
  const counts = rows.reduce(
    (summary, item) => {
      const status = normalizeEmailStatus(item.status);
      if (status === "sent") summary.sent += 1;
      else if (status === "failed") summary.failed += 1;
      else if (status === "cancelled" || status === "canceled") summary.cancelled += 1;
      else summary.prepared += 1;
      return summary;
    },
    { total: rows.length, prepared: 0, sent: 0, failed: 0, cancelled: 0 },
  );
  const last = rows
    .filter((item) => item.sentAt || item.createdAt || item.scheduledFor)
    .sort((a, b) => String(b.sentAt || b.createdAt || b.scheduledFor).localeCompare(String(a.sentAt || a.createdAt || a.scheduledFor)))[0];
  return {
    ...counts,
    lastAt: last?.sentAt || last?.createdAt || last?.scheduledFor || "",
  };
}

function notificationRuleDescription(rule) {
  if (rule.id === "assignment") {
    return "Correo y aviso dentro del sistema para el creador, responsables y destinatarios configurados por marca.";
  }
  return `${rule.channel}. Destinatarios: ${rule.recipients}.`;
}

function renderNotificationRuleStatus(rule) {
  const types = notificationRuleTypeMap[rule.id] || [];
  const summary = emailNotificationSummary(types);
  return `
    <div class="notification-rule">
      <div class="notification-rule__content">
        <strong class="notification-rule__title">${escapeHtml(rule.title)}</strong>
        <div class="notification-rule__description">${escapeHtml(notificationRuleDescription(rule))}</div>
        <div class="notification-rule__metadata">
          <span><strong>Cola</strong>${types.length ? types.map(escapeHtml).join(", ") : "Sin tipo directo"}</span>
          <span><strong>Último evento</strong>${summary.lastAt ? formatDateTime(summary.lastAt) : "Sin registros recientes"}</span>
        </div>
      </div>
      <div class="notification-rule__stats">
        <span class="badge ${rule.enabled ? "green" : "amber"}">${rule.enabled ? "Regla activa" : "Regla pausada"}</span>
        <span class="badge blue">Preparados ${summary.prepared}</span>
        <span class="badge green">Enviados ${summary.sent}</span>
        <span class="badge ${summary.failed ? "red" : "neutral"}">Fallidos ${summary.failed}</span>
      </div>
    </div>
  `;
}

function latestEmailNotification(statuses = []) {
  const statusSet = new Set(statuses.map(normalizeEmailStatus));
  return emailNotifications
    .filter((item) => !statusSet.size || statusSet.has(normalizeEmailStatus(item.status)))
    .slice()
    .sort((a, b) => safeLocaleCompare(b.sentAt || b.createdAt || b.scheduledFor, a.sentAt || a.createdAt || a.scheduledFor))[0] || null;
}

function renderEmailAutomationTechnicalStatus() {
  if (!isSystemAdmin() && isSupabaseMode()) return "";
  const lastRun = weeklyDigestRuns[0] || null;
  const lastWorkerResult = latestEmailNotification(["sent", "failed"]);
  const lastFailure = latestEmailNotification(["failed"]);
  const workerEvidence = emailNotifications.some((item) => normalizeEmailStatus(item.status) === "sent");
  const automationEvidence = Boolean(lastRun);
  const lastError = dataState.lastEmailFunctionError;
  return `
    <section class="panel section email-technical-status">
      <div class="section-header">
        <div>
          <h2 class="section-title">Estado técnico del correo</h2>
          <div class="small-muted">Diagnóstico administrativo sin mostrar credenciales ni secretos.</div>
        </div>
        <span class="badge neutral">Solo administración</span>
      </div>
      <div class="email-technical-status-grid">
        <div>
          <span>Worker configurado</span>
          <strong>${workerEvidence ? "Sí, hay envíos registrados" : "Sin evidencia de envío"}</strong>
        </div>
        <div>
          <span>Automatización semanal</span>
          <strong>${automationEvidence ? "Con ejecuciones registradas" : dataState.weeklyDigestRunsReady ? "Sin ejecución registrada" : "No se pudo consultar"}</strong>
        </div>
        <div>
          <span>Última ejecución semanal</span>
          <strong>${lastRun ? `${formatDateTime(lastRun.createdAt || lastRun.runDate)} · ${escapeHtml(lastRun.status)}` : "Sin registro"}</strong>
        </div>
        <div>
          <span>Último resultado del worker</span>
          <strong>${lastWorkerResult ? `${formatDateTime(lastWorkerResult.sentAt || lastWorkerResult.createdAt)} · ${escapeHtml(lastWorkerResult.status)}` : "Sin registro"}</strong>
        </div>
        <div>
          <span>Próxima ejecución semanal</span>
          <strong>Lunes 08:00 · America/Guatemala (14:00 UTC)</strong>
        </div>
        <div>
          <span>Frecuencia esperada del worker</span>
          <strong>Cada 5 minutos</strong>
        </div>
      </div>
      ${
        lastError || lastFailure
          ? `<div class="admin-note">
              Último error: ${escapeHtml(lastError?.message || lastFailure?.errorMessage || "Error de envío sin detalle")}
            </div>`
          : ""
      }
    </section>
  `;
}

function renderEmailQueueStatusPanel() {
  const summary = emailNotificationSummary();
  const lastError = dataState.lastEmailFunctionError;
  return `
    <section class="panel section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Estado real de correos</h2>
          <div class="small-muted">
            Últimos ${emailNotifications.length} registros leídos de email_notifications.
            ${dataState.emailNotificationsReady ? "" : "No se pudo leer la cola con el usuario actual."}
          </div>
        </div>
        <span class="badge amber">Preparar no es enviar</span>
      </div>
      <section class="grid grid-4">
        ${renderMetric("Preparados", summary.prepared, "queued/pending esperando worker")}
        ${renderMetric("Enviados", summary.sent, "status sent")}
        ${renderMetric("Fallidos", summary.failed, "Revisar error_message")}
        ${renderMetric("Cancelados", summary.cancelled, "No se enviarán")}
      </section>
      ${
        lastError
          ? `<div class="admin-note">
              Último error de función: ${escapeHtml(lastError.functionName)} · status ${escapeHtml(lastError.status || "sin status")} · ${escapeHtml(lastError.message)}
            </div>`
          : ""
      }
    </section>
  `;
}

function renderNotifications() {
  const openOrders = workOrders.filter(isOpenWorkOrder);
  const overdueOrders = openOrders.filter((order) => daysUntil(order.dueDate) < 0);
  const emailSummary = emailNotificationSummary();
  const canManageEmailAutomation = isSystemAdmin() || !isSupabaseMode();
  return `
    <section class="section">
      <div class="panel brand-hero">
        <div>
          <div class="hero-title">
            <h2>Notificaciones de OTs</h2>
            <span class="badge blue">Cola + worker</span>
          </div>
          <p class="muted">Consulta eventos preparados, entregados y fallidos de las órdenes de trabajo.</p>
        </div>
        <div class="quick-links">
          ${
            canManageEmailAutomation
              ? `<button class="button" data-action="run-daily-digest-now">Preparar y enviar resumen diario</button>
                 <button class="button-ghost" data-action="send-email-queue">Enviar pendientes</button>`
              : ""
          }
          <button class="button-ghost" data-module="work-orders">Ver OTs</button>
        </div>
      </div>
      <section class="grid grid-4">
        ${renderMetric("OTs monitoreadas", openOrders.length, "Abiertas en todas las marcas")}
        ${renderMetric("Vencidas", overdueOrders.length, "Incluidas como alerta roja")}
        ${renderMetric("Correos preparados", emailSummary.prepared, "Pendientes de email-worker")}
        ${renderMetric("Correos fallidos", emailSummary.failed, "Con error_message")}
      </section>
      ${renderBrandEmailRecipientManager()}
      ${renderEmailQueueStatusPanel()}
      ${renderEmailAutomationTechnicalStatus()}
      <section class="grid grid-2 notifications-detail-grid">
        <div class="panel section">
          <div class="section-header">
            <h2 class="section-title">Reglas activas</h2>
            <span class="badge amber">Estado de cola</span>
          </div>
          <div class="stack">
            ${notificationRules
              .map(renderNotificationRuleStatus)
              .join("")}
          </div>
        </div>
        <div class="panel section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Resúmenes programados</h2>
              <div class="small-muted">Preparación de digest diario/semanal. El envío depende de email-worker.</div>
            </div>
            ${
              canManageEmailAutomation
                ? `<div class="row wrap">
                    <button class="button-ghost small" data-action="queue-daily-digest">Preparar resumen diario</button>
                    <button class="button-ghost small" data-action="queue-weekly-digest">Preparar resumen semanal</button>
                  </div>`
                : ""
            }
          </div>
          <div class="small-muted">
            El resumen semanal se prepara los lunes a las 08:00 de Guatemala y la cola se procesa automáticamente.
            Los controles manuales son únicamente un respaldo administrativo.
          </div>
          ${renderWeeklyDigestPreview()}
        </div>
      </section>
      ${
        canManageEmailAutomation
          ? `<section class="panel section notification-guide">
              <div class="section-header">
                <div>
                  <h2 class="section-title">Como funcionan las notificaciones</h2>
                  <div class="small-muted">Guia administrativa del flujo de preparación y envío.</div>
                </div>
                <span class="badge neutral">Solo administración</span>
              </div>
              <div class="notification-guide-grid">
                <div class="mini-card">
                  <strong>1. Correos preparados</strong>
                  <span class="muted">Las reglas crean registros pendientes de procesamiento.</span>
                </div>
                <div class="mini-card">
                  <strong>2. Envio real</strong>
                  <span class="muted">El worker procesa la cola automáticamente y registra enviados o fallidos.</span>
                </div>
                <div class="mini-card">
                  <strong>3. Resumen diario</strong>
                  <span class="muted">Prepara correos con los cambios recientes de cada persona.</span>
                </div>
                <div class="mini-card">
                  <strong>4. Resumen semanal</strong>
                  <span class="muted">Se prepara los lunes y entra en el mismo flujo automático de envío.</span>
                </div>
                <div class="mini-card">
                  <strong>5. Automatizacion</strong>
                  <span class="muted">El estado técnico superior muestra la evidencia disponible de ejecuciones.</span>
                </div>
              </div>
              <div class="admin-note">
                Los controles manuales son un respaldo. Las credenciales permanecen en Supabase y nunca se muestran en el navegador.
              </div>
            </section>`
          : ""
      }
    </section>
  `;
}

function renderProductions() {
  const rows = relatedProductions();
  return `
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Producciones y entregables</h2>
        <button class="button">Nuevo llamado</button>
      </div>
      <div class="grid grid-2">
        ${rows
          .map(
            (production) => `
              <div class="panel stack">
                <div class="row between">
                  <h3 class="section-title">${production.title}</h3>
                  <span class="badge ${production.status === "confirmed" ? "green" : "amber"}">${production.status}</span>
                </div>
                <div class="muted">${formatDate(production.date)} / ${production.time} / ${production.location}</div>
                <div class="divider"></div>
                <strong>Entregables</strong>
                ${production.deliverables
                  .map((id) => {
                    const item = contentItems.find((contentItem) => contentItem.id === id);
                    return item
                      ? `<button class="content-chip" data-content="${item.id}">
                          <strong>${item.title}</strong>
                          <span>${getBrand(item.brandId).shortName} / ${item.format}</span>
                        </button>`
                      : "";
                  })
                  .join("")}
                <button class="button-ghost small">Preparar llamado</button>
              </div>
            `,
          )
          .join("") || `<div class="empty">Sin producciones conectadas</div>`}
      </div>
    </section>
  `;
}

function renderContent() {
  const selected = contentItems.find((item) => item.id === state.selectedContentId) || brandItems()[0];
  if (!isAllBrandsScope() && selected && selected.brandId !== state.currentBrandId) {
    state.selectedContentId = brandItems()[0]?.id || null;
  }
  const selectedItem = contentItems.find((item) => item.id === state.selectedContentId) || visibleContentItems()[0] || brandItems()[0];
  return `
    <section class="section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Calendario de contenido</h2>
          <div class="small-muted">${getScopeTitle()} / Mayo 2026 / vista ${stageLabels[state.contentView]}</div>
        </div>
        <div class="row wrap">
          <div class="segmented">
            ${["concept", "final", "scheduled"]
              .map(
                (stage) => `
                  <button class="${state.contentView === stage ? "active" : ""}" data-content-view="${stage}">
                    ${stageLabels[stage]}
                  </button>
                `,
              )
              .join("")}
          </div>
          <button class="button-ghost" data-action="new-content">Nueva pieza</button>
          <button class="button" data-action="send-client-review">Enviar a cliente</button>
        </div>
      </div>
      <div class="calendar-layout">
        <div class="section">
          ${isAllBrandsScope() ? "" : renderConceptComposer()}
          ${renderCalendar()}
        </div>
        <aside class="panel detail-panel">
          ${selectedItem ? renderContentDetail(selectedItem, true) : `<div class="empty">Sin piezas para este scope</div>`}
        </aside>
      </div>
    </section>
  `;
}

function renderConceptComposer() {
  return `
    <div class="panel tight section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Composer de concepto</h2>
          <div class="small-muted">Crea la idea antes de convertirla en final o calendario programado.</div>
        </div>
        <button class="button small" data-action="compose-concept">Crear concepto</button>
      </div>
      <div class="form-grid">
        <div class="field">
          <label>Idea base</label>
          <input class="input" id="concept-title" value="Idea para ${getBrand().shortName}" />
        </div>
        <div class="field">
          <label>Pilar</label>
          <select class="input">
            <option>Educativo</option>
            <option>Venta</option>
            <option>Comunidad</option>
            <option>Entretenimiento</option>
          </select>
        </div>
        <div class="field full">
          <label>Brief rapido</label>
          <textarea class="textarea" id="concept-brief">Problema, insight, formato sugerido y CTA tentativo.</textarea>
        </div>
      </div>
    </div>
  `;
}

function renderCalendar() {
  const days = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
  const monthDays = Array.from({ length: 35 }, (_, index) => index + 1);
  const items = visibleContentItems();
  return `
    <div class="calendar-grid">
      ${days.map((day) => `<div class="calendar-head">${day}</div>`).join("")}
      ${monthDays
        .map((day) => {
          const dayItems = items.filter((item) => new Date(item.scheduledAt).getDate() === day);
          return `
            <div class="calendar-day">
              <div class="day-number">${day <= 31 ? day : ""}</div>
              ${dayItems
                .map(
                  (item) => `
                    <button class="content-chip" style="--accent:${getBrand(item.brandId).color}" data-content="${item.id}">
                      <strong>${item.title}</strong>
                      <span>${item.platform} / ${stageLabels[item.stage]} / ${statusLabels[item.status]}</span>
                    </button>
                  `,
                )
                .join("")}
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderContentDetail(item, internal) {
  const asset = getAsset(item.assetVersionId);
  const assignee = users.find((user) => user.id === item.owner);
  const versionEvents = [
    ["Concepto", item.stage === "concept" ? "Activo" : "Completado"],
    ["Final", ["final", "scheduled"].includes(item.stage) ? "Activo" : "Pendiente"],
    ["Cliente", ["client_review", "changes_requested", "approved"].includes(item.status) ? statusLabels[item.status] : "Pendiente"],
  ];
  return `
    <div class="stack">
      <div class="row between">
        <h2 class="section-title">${item.title}</h2>
        <span class="badge ${clsStatus(item.status)}">${statusLabels[item.status]}</span>
      </div>
      <div class="badge-row">
        <span class="badge blue">${stageLabels[item.stage]}</span>
        <span class="badge">${item.platform}</span>
        <span class="badge">${item.format}</span>
        <span class="badge purple">${item.pillar}</span>
      </div>
      <div class="divider"></div>
      <div class="stack">
        <strong>Copy</strong>
        <p class="muted">${item.caption}</p>
      </div>
      <div class="stack">
        <strong>Fecha</strong>
        <span>${formatDateTime(item.scheduledAt)}</span>
      </div>
      <div class="stack">
        <strong>Responsable</strong>
        <span>${assignee?.name || "Sin asignar"}</span>
      </div>
      <div class="stack">
        <strong>Flujo</strong>
        <div class="pipeline">
          ${versionEvents
            .map(
              ([label, status]) => `
                <div class="pipeline-step ${status === "Pendiente" ? "" : "active"}">
                  <strong>${label}</strong>
                  <span>${status}</span>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
      ${
        asset
          ? `
          <div class="stack">
            <strong>Asset visual</strong>
            <div class="mini-card">
              <div class="row between">
                <span>${asset.title}</span>
                <span class="badge ${asset.approved ? "green" : "amber"}">${asset.approved ? "Aprobado" : "Pendiente"}</span>
              </div>
              <button class="button-ghost small" data-module="assets">Ver asset</button>
            </div>
          </div>`
          : ""
      }
      <div class="divider"></div>
      <div class="stack">
        <strong>Comentarios</strong>
        ${item.comments
          .filter((comment) => internal || comment.visibility === "client")
          .map(
            (comment) => `
              <div class="comment ${comment.visibility}">
                <strong>${comment.author}</strong>
                <div class="muted">${comment.visibility === "internal" ? "Interno" : "Cliente"}</div>
                <p>${comment.text}</p>
              </div>
            `,
          )
          .join("") || `<span class="muted">Sin comentarios</span>`}
      </div>
      ${
        internal
          ? `
            <div class="mini-card">
              <strong>Agregar comentario</strong>
              <textarea class="textarea" data-comment-input="${item.id}" placeholder="Escribe una nota, cambio o decision..."></textarea>
              <div class="row wrap">
                <select class="input compact-input" data-comment-visibility="${item.id}">
                  <option value="internal">Interno</option>
                  <option value="client">Visible cliente</option>
                </select>
                <button class="button small" data-action="add-comment" data-id="${item.id}">Guardar comentario</button>
              </div>
            </div>
          `
          : ""
      }
      <div class="row wrap">
        <button class="button-ghost small" data-action="generate-copy">IA copy</button>
        <button class="button-ghost small" data-action="new-order">Crear OT</button>
        <button class="button-ghost small" data-action="move-final" data-id="${item.id}">Pasar a final</button>
        <button class="button-ghost small" data-action="move-scheduled" data-id="${item.id}">Programar</button>
        <button class="button-ghost small" data-action="request-changes" data-id="${item.id}">Pedir cambios</button>
        <button class="button small" data-action="approve-content" data-id="${item.id}">Aprobar</button>
      </div>
    </div>
  `;
}

function renderAssets() {
  const assets = isAllBrandsScope()
    ? assetVersions
    : assetVersions.filter((asset) => asset.brandId === state.currentBrandId);
  return `
    <section class="section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Assets y Canva</h2>
          <div class="small-muted">${isAllBrandsScope() ? "Todas las carpetas Canva conectadas" : getBrand().canvaFolder}</div>
        </div>
        <button class="button">Agregar asset</button>
      </div>
      <div class="grid grid-3">
        ${assets.map((asset) => renderAssetCard(asset)).join("") || `<div class="empty">Sin assets para esta marca</div>`}
      </div>
    </section>
  `;
}

function renderAssetCard(asset) {
  const item = contentItems.find((contentItem) => contentItem.id === asset.contentItemId);
  const design = getCanvaDesign(asset.canvaDesignId);
  const tone = {
    green: "linear-gradient(135deg, #1f6e4d, #70bf8e)",
    cyan: "linear-gradient(135deg, #0f6478, #57b0c5)",
    red: "linear-gradient(135deg, #a63a34, #e57968)",
    purple: "linear-gradient(135deg, #5b4089, #a88cd3)",
  }[asset.previewTone];
  return `
    <article class="preview-panel">
      <div class="asset-preview" style="background:${tone}">
        <div class="asset-copy">
          <strong>${asset.title}</strong>
          <span>${item ? item.platform + " / " + item.format : asset.format}</span>
        </div>
      </div>
      <div class="row between">
        <strong>${asset.title}</strong>
        <span class="badge ${asset.approved ? "green" : "amber"}">${asset.approved ? "Version aprobada" : asset.status}</span>
      </div>
      <div class="muted">Canva: ${design?.lastSyncedAt || "Sin sincronizar"}</div>
      <div class="row wrap">
        <a class="button-ghost small" href="${design?.editUrl || "https://www.canva.com"}" target="_blank" rel="noreferrer">Abrir en Canva</a>
        <button class="button-ghost small" data-action="sync-asset" data-id="${asset.id}">Sincronizar preview</button>
        <button class="button small" data-action="approve-asset" data-id="${asset.id}">Aprobar versión</button>
      </div>
    </article>
  `;
}

function renderCopywriting() {
  if (isAllBrandsScope()) {
    return renderBrandPickerPrompt(
      "Elige una marca para generar copy",
      "La IA necesita tono, plataformas, reglas y contexto de una marca especifica para generar algo util.",
    );
  }
  return `
    <section class="grid grid-2">
      <div class="panel section">
        <h2 class="section-title">Generador de captions</h2>
        <div class="form-grid">
          <div class="field">
            <label>Plataforma</label>
            <select class="input" id="copy-platform">
              ${getBrand().platforms.map((platform) => `<option>${platform}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>Pilar</label>
            <select class="input" id="copy-pillar">
              <option>Educativo</option>
              <option>Venta</option>
              <option>Comunidad</option>
              <option>Entretenimiento</option>
            </select>
          </div>
          <div class="field full">
            <label>Instrucciones</label>
            <textarea class="textarea" id="copy-brief">Crear una pieza alineada a ${getBrand().name} con CTA claro.</textarea>
          </div>
          <div class="full row wrap">
            <button class="button" data-action="generate-copy">Generar opciones</button>
            <button class="button-ghost" data-action="copy-to-content">Convertir en pieza</button>
          </div>
        </div>
      </div>
      <div class="panel section">
        <h2 class="section-title">Resultado sugerido</h2>
        <div class="mini-card">
          <strong>Opcion 1</strong>
          <p class="muted">Tu rutina tambien puede sentirse mas simple, mas rica y mas tuya. Guarda esta idea para tu proximo contenido.</p>
          <span class="badge green">Lista para draft</span>
        </div>
        <div class="mini-card">
          <strong>Opcion 2</strong>
          <p class="muted">Cuando una marca tiene algo claro que decir, el contenido trabaja mejor. Probemos este angulo esta semana.</p>
          <span class="badge amber">Requiere ajuste</span>
        </div>
      </div>
    </section>
  `;
}

function renderCreativity() {
  const ideas = [
    ["Serie de tips", "3 piezas cortas desde un problema comun del consumidor.", "Educativo"],
    ["Antes y despues", "Comparar rutina actual contra una solucion simple de la marca.", "Venta"],
    ["Detras de camaras", "Humanizar el proceso del equipo y la marca.", "Comunidad"],
  ];
  return `
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Ideas accionables</h2>
        <button class="button">Generar ideas</button>
      </div>
      <div class="grid grid-3">
        ${ideas
          .map(
            ([title, description, pillar]) => `
              <div class="panel stack">
                <div class="row between">
                  <h3 class="section-title">${title}</h3>
                  <span class="badge purple">${pillar}</span>
                </div>
                <p class="muted">${description}</p>
                <div class="row wrap">
                  <button class="button-ghost small">Crear OT</button>
                  <button class="button small" data-action="idea-to-content">Crear pieza</button>
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function reportLoadScore({ open = 0, overdue = 0, review = 0 }) {
  return Math.min(100, open * 15 + overdue * 26 + review * 10);
}

function reportScopeBrands() {
  return isAllBrandsScope() ? brands.filter((brand) => brand.isActive !== false) : [getBrand()].filter(Boolean);
}

function reportFilteredOrders(orders) {
  if (state.reportMonth) {
    return orders.filter((order) => dateMatchesMonth(order.dueDate, state.reportMonth));
  }
  if (state.reportStartDate || state.reportEndDate) {
    return orders.filter((order) => inDateRange(order.dueDate, state.reportStartDate, state.reportEndDate));
  }
  return orders;
}

function clientReportRows(orders, scopedBrands) {
  const scopedBrandIds = new Set(scopedBrands.map((brand) => brand.id));
  return brandCollectionGroups()
    .map((group) => {
      const clientItem = group.client || { id: group.id, name: group.label };
      const clientBrands = group.brands.filter((brand) => scopedBrandIds.has(brand.id));
      const clientBrandIds = new Set(clientBrands.map((brand) => brand.id));
      const clientOrders = orders.filter((order) => clientBrandIds.has(order.brandId));
      const open = clientOrders.filter(isOpenWorkOrder);
      const completed = clientOrders.filter(isDeliveredWorkOrder);
      const lateCompleted = completed.filter(wasCompletedLate);
      const overdueOpen = open.filter((order) => daysUntil(order.dueDate) < 0);
      const review = open.filter((order) => order.status === "in_review");
      const onTime = completed.length ? percent(completed.length - lateCompleted.length, completed.length) : null;
      return {
        client: clientItem,
        brands: clientBrands.length,
        total: clientOrders.length,
        open: open.length,
        completed: completed.length,
        lateCompleted: lateCompleted.length,
        overdueOpen: overdueOpen.length,
        review: review.length,
        onTime,
      };
    })
    .filter((row) => row.brands || row.total)
    .sort((a, b) => b.overdueOpen - a.overdueOpen || b.lateCompleted - a.lateCompleted || b.open - a.open || a.client.name.localeCompare(b.client.name));
}

function brandReportRows(orders, scopedBrands) {
  return scopedBrands
    .map((brand) => {
      const brandScopedOrders = orders.filter((order) => order.brandId === brand.id);
      const open = brandScopedOrders.filter(isOpenWorkOrder);
      const completed = brandScopedOrders.filter(isDeliveredWorkOrder);
      const lateCompleted = completed.filter(wasCompletedLate);
      const overdueOpen = open.filter((order) => daysUntil(order.dueDate) < 0);
      const review = open.filter((order) => order.status === "in_review");
      return {
        brand,
        client: getClient(brand.clientId),
        total: brandScopedOrders.length,
        open: open.length,
        completed: completed.length,
        lateCompleted: lateCompleted.length,
        overdueOpen: overdueOpen.length,
        review: review.length,
        completion: percent(completed.length, brandScopedOrders.length),
      };
    })
    .sort((a, b) => b.overdueOpen - a.overdueOpen || b.open - a.open || b.total - a.total || a.brand.shortName.localeCompare(b.brand.shortName));
}

function categoryReportRows(orders) {
  return Object.entries(workOrderCategoryLabels)
    .map(([category, label]) => {
      const categoryOrders = orders.filter((order) => order.category === category);
      const open = categoryOrders.filter(isOpenWorkOrder);
      const completed = categoryOrders.filter(isDeliveredWorkOrder);
      return { category, label, total: categoryOrders.length, open: open.length, completed: completed.length };
    })
    .filter((row) => row.total)
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

function reportInsights({ overdueOpen, lateCompleted, reviewOrders, teamRows, clientRows }) {
  const insights = [];
  const overloaded = teamRows.filter((row) => row.open >= 5 || row.overdue > 0).slice(0, 3);
  const clientsWithRisk = clientRows.filter((row) => row.overdueOpen || row.lateCompleted).slice(0, 3);

  if (overdueOpen.length) {
    insights.push({
      title: `${overdueOpen.length} OTs vencidas siguen abiertas`,
      detail: "Conviene revisarlas en daily y moverlas a cierre, cambio de fecha o bloqueo documentado.",
      cls: "red",
    });
  }
  if (lateCompleted.length) {
    insights.push({
      title: `${lateCompleted.length} entregas cerradas fuera de fecha`,
      detail: "Buen dato para ajustar tiempos prometidos por cliente o tipo de trabajo.",
      cls: "amber",
    });
  }
  if (reviewOrders.length) {
    insights.push({
      title: `${reviewOrders.length} OTs esperando revisión`,
      detail: "Si se acumulan aquí, el cuello de botella suele estar en aprobación interna o feedback.",
      cls: "blue",
    });
  }
  if (overloaded.length) {
    insights.push({
      title: `Muchas tareas: ${overloaded.map((row) => row.user.name.split(" ")[0]).join(", ")}`,
      detail: "Revisa redistribución antes de asignar nuevas OTs urgentes.",
      cls: "purple",
    });
  }
  if (clientsWithRisk.length) {
    insights.push({
      title: `Clientes con friccion: ${clientsWithRisk.map((row) => row.client.name).join(", ")}`,
      detail: "Estos clientes concentran entregas tarde o vencimientos abiertos.",
      cls: "red",
    });
  }
  if (!insights.length) {
    insights.push({
      title: "Operación estable",
      detail: "No hay vencimientos ni retrasos visibles en este scope. Buen momento para planificar siguientes entregas.",
      cls: "green",
    });
  }
  return insights;
}

function currentReportSnapshot() {
  const rawScopedOrders = brandOrders();
  const scopedOrders = reportFilteredOrders(rawScopedOrders);
  const scopedBrands = reportScopeBrands();
  const openOrders = scopedOrders.filter(isOpenWorkOrder);
  const completedOrders = scopedOrders.filter(isDeliveredWorkOrder);
  const overdueOpen = openOrders.filter((order) => daysUntil(order.dueDate) < 0);
  const lateCompleted = completedOrders.filter(wasCompletedLate);
  const reviewOrders = openOrders.filter((order) => order.status === "in_review");
  const teamRows = weeklyDigestRows(scopedOrders)
    .map((row) => ({ ...row, load: reportLoadScore(row) }))
    .sort((a, b) => b.overdue - a.overdue || b.open - a.open || b.load - a.load || a.user.name.localeCompare(b.user.name));
  const clientRows = clientReportRows(scopedOrders, scopedBrands);
  const brandRows = brandReportRows(scopedOrders, scopedBrands);
  const categoryRows = categoryReportRows(scopedOrders);
  return {
    rawScopedOrders,
    scopedOrders,
    scopedBrands,
    openOrders,
    completedOrders,
    overdueOpen,
    lateCompleted,
    reviewOrders,
    teamRows,
    clientRows,
    brandRows,
    categoryRows,
    onTimeRate: completedOrders.length ? percent(completedOrders.length - lateCompleted.length, completedOrders.length) : 0,
  };
}

function reportPeriodLabel() {
  if (state.reportMonth) return state.reportMonth;
  if (state.reportStartDate || state.reportEndDate) {
    return `${state.reportStartDate || "inicio"} a ${state.reportEndDate || "hoy"}`;
  }
  return "Todos los registros";
}

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadWorkspaceBackup() {
  const rows = workOrders.map((order) => {
    const brand = getBrand(order.brandId);
    const client = getClient(brand.clientId);
    return [
      order.id,
      client?.name || "",
      brand.shortName,
      order.title,
      workOrderStatusLabels[order.status] || order.status,
      workOrderPriorityLabels[order.priority] || order.priority,
      workOrderCategoryLabels[order.category] || order.category,
      order.dueDate || "",
      orderAssignees(order).map(userName).join("; "),
      orderFiles(order).map((file) => file.name).join("; "),
      isArchivedWorkOrder(order) ? "si" : "no",
      order.createdAt || "",
      order.updatedAt || "",
    ];
  });
  const header = ["codigo", "cliente", "marca", "titulo", "estado", "prioridad", "categoria", "deadline", "responsables", "archivos", "archivada", "creada", "actualizada"];
  const csv = [header, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
  downloadTextFile(`lumen-workspace-backup-${isoDateFromDate(todayAtNoon())}.csv`, csv, "text/csv;charset=utf-8");
  showToast("Backup CSV descargado. Excel lo abre directo.");
}

function downloadWorkspaceJsonBackup() {
  const backup = {
    exportedAt: new Date().toISOString(),
    clients,
    brands,
    users: users.map(({ id, name, email, role, isActive, brands: userBrands }) => ({ id, name, email, role, isActive, brands: userBrands })),
    workOrders,
    contentItems,
    assetVersions,
    canvaDesigns,
  };
  downloadTextFile(
    `lumen-workspace-backup-${isoDateFromDate(todayAtNoon())}.json`,
    JSON.stringify(backup, null, 2),
    "application/json;charset=utf-8",
  );
  showToast("Backup JSON descargado para migracion o recuperacion tecnica.");
}

function downloadReportPdf() {
  const snapshot = currentReportSnapshot();
  const scopeTitle = getScopeTitle();
  const rows = snapshot.clientRows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.client.name)}</td>
          <td>${row.open}</td>
          <td>${row.completed}</td>
          <td>${row.lateCompleted} cerradas / ${row.overdueOpen} abiertas</td>
          <td>${row.onTime === null ? "N/A" : `${row.onTime}%`}</td>
        </tr>
      `,
    )
    .join("");
  const teamRows = snapshot.teamRows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.user.name)}</td>
          <td>${escapeHtml(roleLabels[row.user.role] || row.user.role)}</td>
          <td>${row.open}</td>
          <td>${row.review}</td>
          <td>${row.overdue}</td>
        </tr>
      `,
    )
    .join("");
  const reportWindow = window.open("", "_blank", "width=980,height=720");
  if (!reportWindow) {
    showToast("El navegador bloqueo la ventana del PDF. Permite popups para descargar.");
    return;
  }
  reportWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Informe Lumen Workspace</title>
        <style>
          body{font-family:Arial,Helvetica,sans-serif;margin:34px;color:#2d2d2d;background:#fff;}
          header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:3px solid #49ee8c;padding-bottom:18px;margin-bottom:22px;}
          h1{margin:0;font-size:30px;} h2{font-size:18px;margin:24px 0 10px;} p{color:#62655f;}
          .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0;}
          .metric{border:1px solid #deded8;border-radius:8px;padding:12px;} .metric strong{display:block;font-size:28px;}
          table{width:100%;border-collapse:collapse;margin-top:8px;} th,td{border-bottom:1px solid #e5e5df;padding:10px;text-align:left;font-size:13px;}
          th{background:#f6f6f3;text-transform:uppercase;font-size:11px;letter-spacing:.04em;}
          .badge{display:inline-block;background:#eafff3;color:#157a44;border-radius:999px;padding:6px 10px;font-weight:700;}
          @media print{button{display:none;} body{margin:20px;}}
        </style>
      </head>
      <body>
        <header>
          <div>
            <span class="badge">Lumen Workspace</span>
            <h1>Informe operativo</h1>
            <p>${escapeHtml(scopeTitle)} / ${escapeHtml(reportPeriodLabel())}</p>
          </div>
          <button onclick="window.print()" style="padding:10px 14px;border:0;border-radius:8px;background:#2d2d2d;color:#fff;font-weight:800;">Guardar como PDF</button>
        </header>
        <section class="metrics">
          <div class="metric"><span>OTs abiertas</span><strong>${snapshot.openOrders.length}</strong></div>
          <div class="metric"><span>Entregadas</span><strong>${snapshot.completedOrders.length}</strong></div>
          <div class="metric"><span>Fuera de fecha</span><strong>${snapshot.lateCompleted.length}</strong></div>
          <div class="metric"><span>Cumplimiento</span><strong>${snapshot.completedOrders.length ? `${snapshot.onTimeRate}%` : "N/A"}</strong></div>
        </section>
        <h2>Clientes y cumplimiento</h2>
        <table>
          <thead><tr><th>Cliente</th><th>Abiertas</th><th>Entregadas</th><th>Fuera de fecha</th><th>A tiempo</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="5">Sin datos</td></tr>`}</tbody>
        </table>
        <h2>Tareas por responsable</h2>
        <table>
          <thead><tr><th>Responsable</th><th>Rol</th><th>Abiertas</th><th>Revisión</th><th>Vencidas</th></tr></thead>
          <tbody>${teamRows || `<tr><td colspan="5">Sin equipo activo</td></tr>`}</tbody>
        </table>
      </body>
    </html>
  `);
  reportWindow.document.close();
  showToast("Informe imprimible abierto. Usa Guardar como PDF.");
}

function renderReportClientDisclosure(row, index = 0) {
  const riskCount = row.lateCompleted + row.overdueOpen;
  return `
    <details class="report-disclosure" ${index === 0 && riskCount ? "open" : ""}>
      <summary>
        <span class="summary-main">
          <strong>${escapeHtml(row.client.name)}</strong>
          <small>${row.brands} marcas / ${row.total} OTs</small>
        </span>
        <span class="summary-metrics">
          <span>${row.open} abiertas</span>
          <span>${row.completed} entregadas</span>
          <span class="${riskCount ? "text-red" : ""}">${riskCount} riesgos</span>
          <span class="badge ${riskCount ? "red" : "green"}">${row.onTime === null ? "Sin cierre" : `${row.onTime}% a tiempo`}</span>
        </span>
      </summary>
      <div class="disclosure-body">
        <div>
          <strong>Lectura rápida</strong>
          <p class="muted">${row.overdueOpen ? `${row.overdueOpen} OTs siguen vencidas abiertas.` : "No hay vencidas abiertas para este cliente."} ${row.lateCompleted ? `${row.lateCompleted} entregas cerraron fuera de fecha.` : ""}</p>
        </div>
        <button class="button-ghost small" data-module="work-orders">Ver OTs</button>
      </div>
    </details>
  `;
}

function renderReportTeamDisclosure(row, index = 0) {
  const level = loadLevel(row);
  const next = row.next;
  return `
    <details class="report-disclosure" ${index === 0 && (row.overdue || row.open) ? "open" : ""}>
      <summary>
        <span class="summary-main">
          <strong>${escapeHtml(row.user.name)}</strong>
          <small>${escapeHtml(roleLabels[row.user.role] || row.user.role)}</small>
        </span>
        <span class="summary-metrics">
          <span>${row.open} abiertas</span>
          <span class="${row.overdue ? "text-red" : ""}">${row.overdue} vencidas</span>
          <span>${row.review} revisión</span>
          <span class="badge ${level.cls}">${level.label}</span>
        </span>
      </summary>
      <div class="disclosure-body">
        <div>
          <strong>${next ? "Siguiente entrega" : "Sin pendientes"}</strong>
          <p class="muted">${next ? `${next.id} / ${next.title} / ${formatDate(next.dueDate)}` : "Sin OTs abiertas en este periodo."}</p>
        </div>
        <button class="button-ghost small" data-workorder-assignee-filter="${escapeHtml(row.user.id)}">Ver persona</button>
      </div>
    </details>
  `;
}

function renderReportBrandDisclosure(row, index = 0) {
  const riskCount = row.overdueOpen + row.lateCompleted;
  return `
    <details class="report-disclosure" ${index === 0 && riskCount ? "open" : ""}>
      <summary>
        <span class="summary-main">
          <strong>${escapeHtml(row.brand.shortName)}</strong>
          <small>${escapeHtml(row.client?.name || "Cliente")} / ${row.total} OTs</small>
        </span>
        <span class="summary-metrics">
          <span>${row.open} abiertas</span>
          <span>${row.completed} entregadas</span>
          <span class="${riskCount ? "text-red" : ""}">${riskCount} riesgos</span>
          <span>${row.completion}% avance</span>
        </span>
      </summary>
      <div class="disclosure-body">
        <div>
          <strong>Estado de marca</strong>
          <p class="muted">${row.review ? `${row.review} OTs en revisión.` : "Sin cola de revisión visible."} ${row.overdueOpen ? `${row.overdueOpen} vencidas abiertas.` : ""}</p>
        </div>
        <button class="button-ghost small" data-brand-jump="${escapeHtml(row.brand.id)}">Ver marca</button>
      </div>
    </details>
  `;
}

function renderReportLateOrder(order) {
  const brand = getBrand(order.brandId);
  const urgency = isDeliveredWorkOrder(order) ? "Entregada tarde" : "Vencida abierta";
  return `
    <details class="report-disclosure critical-report-disclosure" open>
      <summary>
        <span class="summary-main">
          <strong>${escapeHtml(order.id)}</strong>
          <small>${escapeHtml(order.title)}</small>
        </span>
        <span class="summary-metrics">
          <span>${escapeHtml(getClient(brand.clientId)?.name || "Cliente")} / ${escapeHtml(brand.shortName)}</span>
          <span>${escapeHtml(formatDate(order.dueDate))}</span>
          <span class="badge ${isDeliveredWorkOrder(order) ? "amber" : "red"}">${urgency}</span>
        </span>
      </summary>
      <div class="disclosure-body">
        <div>
          <strong>Responsable</strong>
          <p class="muted">${orderAssignees(order).map(userName).join(", ") || "Sin responsable asignado"}</p>
        </div>
        <button class="button-ghost small" data-action="view-work-order" data-id="${escapeHtml(order.id)}">Ver OT</button>
      </div>
    </details>
  `;
}

function renderReports() {
  const rawScopedOrders = brandOrders();
  const scopedOrders = reportFilteredOrders(rawScopedOrders);
  const scopedBrands = reportScopeBrands();
  const openOrders = scopedOrders.filter(isOpenWorkOrder);
  const completedOrders = scopedOrders.filter(isDeliveredWorkOrder);
  const overdueOpen = openOrders.filter((order) => daysUntil(order.dueDate) < 0);
  const lateCompleted = completedOrders.filter(wasCompletedLate);
  const reviewOrders = openOrders.filter((order) => order.status === "in_review");
  const onTimeRate = completedOrders.length ? percent(completedOrders.length - lateCompleted.length, completedOrders.length) : 0;
  const clientRows = clientReportRows(scopedOrders, scopedBrands);
  const brandRows = brandReportRows(scopedOrders, scopedBrands);
  const categoryRows = categoryReportRows(scopedOrders);
  const teamRows = weeklyDigestRows(scopedOrders)
    .map((row) => ({ ...row, load: reportLoadScore(row) }))
    .sort((a, b) => b.overdue - a.overdue || b.open - a.open || b.load - a.load || a.user.name.localeCompare(b.user.name));
  const maxCategory = Math.max(...categoryRows.map((row) => row.total), 1);
  const insights = reportInsights({ overdueOpen, lateCompleted, reviewOrders, teamRows, clientRows });
  const visibleClientRows = clientRows.filter((row) => row.total).slice(0, 6);
  const activeTeamRows = teamRows.filter((row) => row.open || row.overdue || row.review).slice(0, 8);
  const quietTeamCount = teamRows.filter((row) => !row.open && !row.overdue && !row.review).length;
  const visibleBrandRows = brandRows.filter((row) => row.total).slice(0, 8);
  const criticalDelayOrders = [...overdueOpen, ...lateCompleted].slice(0, 6);

  return `
    <section class="section">
      <div class="panel brand-hero reports-hero">
        <div>
          <div class="hero-title">
          <h2>Reportería operativa</h2>
            <span class="badge green">Agencia en tiempo real</span>
          </div>
          <p class="muted">Panorama de tareas, entregas, atrasos y trabajo activo por cliente, marca y responsable.</p>
        </div>
        <div class="quick-links">
          <button class="button" data-action="download-report-pdf">Descargar informe PDF</button>
          <button class="button-ghost" data-action="download-workspace-backup">Backup Excel</button>
          <button class="button-ghost" data-action="download-workspace-json">Backup JSON</button>
          <button class="button-ghost" data-module="work-orders">Ver OTs</button>
          <button class="button-ghost" data-module="team">Ver equipo</button>
        </div>
      </div>

      <section class="panel section report-filter-panel">
        <div class="section-header">
          <div>
            <h2 class="section-title">Filtros de periodo</h2>
            <div class="small-muted">Analiza tareas y entregas por mes o por rango de fechas.</div>
          </div>
          <span class="badge blue">${scopedOrders.length} de ${rawScopedOrders.length} OTs</span>
        </div>
        <div class="form-grid compact-filter-grid">
          <div class="field">
            <label>Mes</label>
            <input class="input" type="month" data-report-filter="reportMonth" value="${escapeHtml(state.reportMonth)}" />
          </div>
          <div class="field">
            <label>Desde</label>
            <input class="input" type="date" data-report-filter="reportStartDate" value="${escapeHtml(state.reportStartDate)}" />
          </div>
          <div class="field">
            <label>Hasta</label>
            <input class="input" type="date" data-report-filter="reportEndDate" value="${escapeHtml(state.reportEndDate)}" />
          </div>
        </div>
      </section>

      <section class="grid grid-4">
        ${renderMetric("OTs abiertas", openOrders.length, "Trabajo activo en este scope")}
        ${renderMetric("Entregadas", completedOrders.length, "OTs marcadas como completadas")}
        ${renderMetric("Fuera de fecha", lateCompleted.length, "Completadas despues del deadline")}
        ${renderMetric("Cumplimiento", completedOrders.length ? `${onTimeRate}%` : "N/A", "Entregas completadas a tiempo")}
      </section>

      <section class="report-command-stack">
        <div class="panel section report-priority-panel">
          <div class="section-header">
            <div>
              <h2 class="section-title">Qué revisar primero</h2>
              <div class="small-muted">Lectura accionable para decidir dónde poner atención sin abrir todas las tablas.</div>
            </div>
            <span class="badge blue">${insights.length} insights</span>
          </div>
          <div class="insight-grid">
            ${insights
              .map(
                (insight) => `
                  <div class="insight-card">
                    <span class="status-dot ${insight.cls}"></span>
                    <div>
                      <strong>${insight.title}</strong>
                      <p class="muted">${insight.detail}</p>
                    </div>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>

        <div class="panel section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Clientes y cumplimiento</h2>
              <div class="small-muted">Acordeones por cliente. Abre solo el que quieras revisar.</div>
            </div>
            <span class="badge blue">${clientRows.length} clientes</span>
          </div>
          <div class="report-accordion-list">
            ${visibleClientRows.map(renderReportClientDisclosure).join("") || `<div class="empty compact-empty">Sin OTs para reportar</div>`}
          </div>
        </div>

        <div class="panel section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Tareas por responsable</h2>
              <div class="small-muted">Solo personas con tareas activas. El resto queda resumido para no hacer scroll innecesario.</div>
            </div>
            <div class="row wrap">
              <span class="badge amber">${openOrders.length} abiertas</span>
              ${quietTeamCount ? `<span class="badge neutral">${quietTeamCount} sin tareas</span>` : ""}
            </div>
          </div>
          <div class="report-accordion-list">
            ${activeTeamRows.map(renderReportTeamDisclosure).join("") || `<div class="empty compact-empty">Sin equipo con tareas activas en este periodo.</div>`}
          </div>
        </div>

        <div class="panel section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Marcas y entregables</h2>
              <div class="small-muted">Resumen compacto de marcas activas y tipos de trabajo del periodo.</div>
            </div>
            <span class="badge">${brandRows.length} marcas</span>
          </div>
          <div class="report-split">
            <div class="report-accordion-list">
              ${visibleBrandRows.map(renderReportBrandDisclosure).join("") || `<div class="empty compact-empty">Sin marcas para reportar</div>`}
            </div>
            <div class="category-chip-panel">
              <strong>Tareas por tipo de entregable</strong>
              <div class="category-chip-cloud">
                ${
                  categoryRows
                    .map(
                      (row) => `
                        <span class="category-chip">
                          <strong>${escapeHtml(row.label)}</strong>
                          <small>${row.total} total / ${row.open} abiertas</small>
                          <i style="width:${Math.max(10, percent(row.total, maxCategory))}%"></i>
                        </span>
                      `,
                    )
                    .join("") || `<span class="muted">Aún no hay categorías con OTs.</span>`
                }
              </div>
            </div>
          </div>
        </div>

        <div class="panel section">
          <div class="section-header">
            <div>
              <h2 class="section-title">OTs atrasadas críticas</h2>
              <div class="small-muted">Abiertas vencidas y entregas completadas fuera de fecha.</div>
            </div>
            <button class="button-ghost small" data-module="work-orders">Abrir panel</button>
          </div>
          <div class="report-accordion-list">
            ${criticalDelayOrders.map(renderReportLateOrder).join("") || `<div class="empty compact-empty">Sin atrasos visibles en este scope</div>`}
          </div>
        </div>
      </section>
    </section>
  `;
}

function renderTeam() {
  const teamRows = internalUsers();
  return `
    <section class="section">
      <div class="section-header">
        <div>
              <h2 class="section-title">Equipo, tareas y alertas</h2>
              <div class="small-muted">Responsables, marcas, tareas activas y preferencias de email.</div>
        </div>
        <div class="row wrap">
          <button class="button-ghost" data-module="notifications">Configurar emails</button>
          <button class="button" data-module="settings">Administrar usuarios</button>
        </div>
      </div>
      <div class="grid grid-4">
        ${renderMetric("Equipo interno", teamRows.length, "Usuarios operativos")}
        ${renderMetric("OTs abiertas", workOrders.filter(isOpenWorkOrder).length, "Todas las marcas")}
        ${renderMetric("Vencidas", workOrders.filter((order) => isOpenWorkOrder(order) && daysUntil(order.dueDate) < 0).length, "Necesitan seguimiento")}
        ${renderMetric("Digest lunes", "8:00", weeklyDigestConfig.timezone)}
      </div>
      <div class="grid grid-2">
        ${
          teamRows.length
            ? teamRows
                .map((user) => {
                  const workload = teamWorkload(user.id);
                  const collaborative = workload.open.filter((order) => orderAssignees(order).length > 1).length;
                  const capacity = Math.min(100, workload.open.length * 22 + workload.overdue.length * 18 + collaborative * 8);
                  return `
                    <article class="panel team-card">
                      <div class="row between">
                        <div>
                          <h3 class="section-title">${user.name}</h3>
                          <div class="muted">${user.email}</div>
                        </div>
                        <span class="badge blue">${roleLabels[user.role] || user.role}</span>
                      </div>
                      <div class="team-load">
                        <div class="row between">
                          <strong>Tareas activas</strong>
                          <span class="muted">${capacity}%</span>
                        </div>
                        <div class="bar-track"><div class="bar-fill" style="width:${capacity}%"></div></div>
                      </div>
                      <div class="badge-row">
                        <span class="badge ${workload.overdue.length ? "red" : "green"}">${workload.overdue.length} vencidas</span>
                        <span class="badge blue">${workload.open.length} abiertas</span>
                        <span class="badge amber">${workload.review.length} revisión</span>
                        <span class="badge purple">${collaborative} compartidas</span>
                      </div>
                      <div class="stack">
                        ${
                          workload.open
                            .slice(0, 3)
                            .map(
                              (order) => `
                                <div class="mini-card">
                                  <div class="row between">
                                    <strong>${order.id}</strong>
                                    <span class="badge ${workOrderUrgency(order).cls}">${workOrderUrgency(order).label}</span>
                                  </div>
                                  <span class="muted">${getBrand(order.brandId).shortName} / ${order.title}</span>
                                </div>
                              `,
                            )
                            .join("") || `<div class="empty">Sin OTs abiertas</div>`
                        }
                      </div>
                    </article>
                  `;
                })
                .join("")
            : `
              <div class="panel section">
                <div class="empty">
                  No hay usuarios internos activos. Agrega perfiles reales desde Admin para asignar OTs.
                </div>
              </div>
            `
        }
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Marcas</th>
              <th>Correo operativo</th>
            </tr>
          </thead>
          <tbody>
            ${
              users.length
                ? users
                    .map(
                      (user) => `
                        <tr>
                          <td>
                            <strong>${user.name}</strong>
                            <div class="muted">${user.email}</div>
                          </td>
                          <td><span class="badge ${user.role === "cliente" ? "amber" : "blue"}">${roleLabels[user.role] || user.role}</span></td>
                          <td><span class="badge ${user.isActive === false ? "red" : "green"}">${user.isActive === false ? "Inactivo" : "Activo"}</span></td>
                          <td>${userBrandLabel(user)}</td>
                          <td>${user.role === "cliente" ? "Portal cliente" : "Asignaciones, vencimientos, digest lunes"}</td>
                        </tr>
                      `,
                    )
                    .join("")
                : `<tr><td colspan="5">Sin usuarios reales cargados.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderClientPortal() {
  if (isAllBrandsScope()) {
    return renderBrandPickerPrompt(
      "Elige una marca para ver portal cliente",
      "El portal debe mostrar solo el calendario, aprobaciones y reportes visibles de una marca o cliente especifico.",
    );
  }
  const brand = getBrand();
  const visibleItems = brandItems().filter((item) =>
    ["client_review", "changes_requested", "approved"].includes(item.status),
  );
  return `
    <section class="section">
      <div class="panel brand-hero">
        <div>
          <div class="hero-title">
            <h2>Portal cliente</h2>
            <span class="badge blue">${brand.name}</span>
          </div>
          <div class="badge-row">
            <span class="badge">Calendario Mayo 2026</span>
            <span class="badge blue">Modo calendario read-only</span>
            <span class="badge purple">Magic link temporal activo</span>
            <span class="badge green">${visibleItems.filter((item) => item.status === "approved").length} aprobadas</span>
            <span class="badge amber">${visibleItems.filter((item) => item.status !== "approved").length} pendientes</span>
          </div>
        </div>
        <div class="quick-links">
          <button class="button">Aprobar calendario</button>
          <button class="button-ghost">Pedir cambios</button>
          <button class="button-ghost">Copiar magic link</button>
        </div>
      </div>
      <div class="grid grid-2">
        ${visibleItems
          .map(
            (item) => `
              <div class="panel stack">
                ${renderContentDetail(item, false)}
              </div>
            `,
          )
          .join("") || `<div class="empty">Sin piezas visibles para cliente</div>`}
      </div>
    </section>
  `;
}

function getAdminEditingUser() {
  if (state.adminEditingUserId === "__new__") return null;
  return users.find((user) => user.id === state.adminEditingUserId) || users[0] || null;
}

function renderAdminBrandChecks(selectedBrandIds = [], disabled = false) {
  const selected = new Set(selectedBrandIds);
  return `
    <div class="brand-check-groups">
      ${brandCollectionGroups()
        .map((group) => {
          return `
            <div class="brand-check-group">
              <strong>${escapeHtml(group.label)}</strong>
              <div class="brand-check-list">
                ${group.brands
                  .map(
                    (brand) => `
                      <label class="checkbox-line">
                        <input
                          type="checkbox"
                          data-admin-user-brand="${brand.id}"
                          ${selected.has(brand.id) ? "checked" : ""}
                          ${disabled ? "disabled" : ""}
                        />
                        ${escapeHtml(brand.shortName)}
                      </label>
                    `,
                  )
                  .join("")}
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderAdminUserManager(canManage) {
  const selectedUser = getAdminEditingUser();
  const disabled = canManage ? "" : "disabled";
  const isEditing = Boolean(selectedUser);
  const selectedRole = selectedUser?.role || "creativo";
  return `
    <section class="grid admin-layout">
      <div class="panel section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Usuarios reales</h2>
            <div class="small-muted">Perfiles, roles, estado y marcas asignadas.</div>
          </div>
          <button class="button small" data-action="new-admin-user" ${canManage ? "" : "disabled"}>Nuevo perfil</button>
        </div>
        <div class="table-wrap compact-table">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Marcas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${
                users.length
                  ? users
                      .map(
                        (user) => `
                          <tr>
                            <td>
                              <strong>${escapeHtml(user.name)}</strong>
                              <div class="muted">${escapeHtml(user.email)}</div>
                            </td>
                            <td><span class="badge ${user.role === "cliente" ? "amber" : "blue"}">${roleLabels[user.role] || user.role}</span></td>
                            <td><span class="badge ${user.isActive === false ? "red" : "green"}">${user.isActive === false ? "Inactivo" : "Activo"}</span></td>
                            <td>${userBrandLabel(user)}</td>
                            <td><button class="button-ghost small" data-edit-user="${user.id}">Editar</button></td>
                          </tr>
                        `,
                      )
                      .join("")
                  : `<tr><td colspan="5">Todavia no hay perfiles reales cargados.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel section">
        <div class="section-header">
          <div>
            <h2 class="section-title">${isEditing ? "Editar usuario" : "Agregar usuario"}</h2>
            <div class="small-muted">El usuario debe existir primero en Supabase Auth.</div>
          </div>
          <span class="badge ${canManage ? "green" : "amber"}">${canManage ? "Admin activo" : "Solo lectura"}</span>
        </div>
        <div class="admin-note">
          Crea o invita a la persona en Supabase Auth, copia su UUID y guardala aqui con su rol y marcas. La app nunca usa service_role en el navegador.
        </div>
        <div class="form-grid">
          <div class="field full">
            <label>UUID de Supabase Auth</label>
            <input class="input mono-input" id="admin-user-id" value="${escapeHtml(selectedUser?.id || "")}" ${isEditing ? "readonly" : ""} ${disabled} placeholder="00000000-0000-0000-0000-000000000000" />
          </div>
          <div class="field">
            <label>Nombre completo</label>
            <input class="input" id="admin-user-name" value="${escapeHtml(selectedUser?.name || "")}" ${disabled} />
          </div>
          <div class="field">
            <label>Email</label>
            <input class="input" id="admin-user-email" type="email" value="${escapeHtml(selectedUser?.email || "")}" ${disabled} />
          </div>
          <div class="field">
            <label>Rol</label>
            <select class="input" id="admin-user-role" ${disabled}>
              ${renderVisibleRoleOptions(selectedRole)}
            </select>
          </div>
          <div class="field">
            <label>Estado</label>
            <select class="input" id="admin-user-active" ${disabled}>
              <option value="true" ${selectedUser?.isActive === false ? "" : "selected"}>Activo</option>
              <option value="false" ${selectedUser?.isActive === false ? "selected" : ""}>Inactivo</option>
            </select>
          </div>
          <div class="field full">
            <label>Marcas asignadas</label>
            ${renderAdminBrandChecks(selectedUser?.brands || [], !canManage)}
            <div class="field-help">Admin y Dirección pueden ver todo; las marcas ayudan a ordenar asignaciones y tareas.</div>
          </div>
          <div class="full row wrap">
            <button class="button" data-action="save-admin-user" ${canManage ? "" : "disabled"}>Guardar usuario</button>
            <button class="button-ghost" data-action="new-admin-user" ${canManage ? "" : "disabled"}>Limpiar formulario</button>
            ${
              isEditing
                ? `<button class="button-danger" data-action="${selectedUser.isActive === false ? "activate-admin-user" : "deactivate-admin-user"}" data-id="${selectedUser.id}" ${canManage ? "" : "disabled"}>
                    ${selectedUser.isActive === false ? "Activar" : "Desactivar"}
                  </button>`
                : ""
            }
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderProfile() {
  const profile = dataState.profile;
  const connectionLabel = isSupabaseMode() ? "Supabase" : "Demo local";
  const connectionDetail = isSupabaseMode() ? "Datos compartidos activos" : "Usando datos del navegador";
  return `
    <section class="section">
      <section class="grid grid-2">
        <div class="panel section">
          <div class="section-header">
            <h2 class="section-title">Perfil</h2>
            <span class="badge ${isSupabaseMode() ? "green" : "amber"}">${connectionLabel}</span>
          </div>
          <div class="stack">
            <div class="mini-card">
              <strong>${profile?.full_name || "Usuario demo"}</strong>
              <span class="muted">${profile?.email || "Sin sesion Supabase"}</span>
            </div>
            <div class="mini-card">
              <strong>Rol</strong>
              <span class="muted">${roleLabels[profile?.role] || "Admin demo"}</span>
            </div>
            <div class="mini-card">
              <strong>Permisos</strong>
              <span class="muted">${isManagementDashboardRole() ? "Puede gestionar el workspace según su rol" : "Puede consultar y avanzar sus fases asignadas"}</span>
            </div>
            <div class="mini-card password-card">
              <strong>Cambiar password</strong>
              <span class="muted">Actualiza tu acceso sin tocar usuarios del equipo.</span>
              <input class="input" id="settings-new-password" type="password" autocomplete="new-password" placeholder="Nuevo password" />
              <input class="input" id="settings-confirm-password" type="password" autocomplete="new-password" placeholder="Confirmar password" />
              <button class="button-ghost small" data-action="change-own-password">Guardar password</button>
            </div>
          </div>
        </div>
        <div class="panel section">
          <div class="section-header">
            <h2 class="section-title">Accesos</h2>
            <span class="badge blue">Operativo</span>
          </div>
          <div class="quick-action-grid">
            <button class="button" data-module="dashboard">Dashboard</button>
            <button class="button-ghost" data-module="work-orders">${isOperationalUserRole() ? "Mis órdenes" : "Órdenes de trabajo"}</button>
            <button class="button-ghost" data-module="calendar">Calendario</button>
            <button class="button-danger" data-action="logout">Cerrar sesion</button>
          </div>
        </div>
      </section>
    </section>
  `;
}

function renderSettings() {
  const openOrders = workOrders.filter(isOpenWorkOrder);
  const overdueOrders = openOrders.filter((order) => daysUntil(order.dueDate) < 0);
  const connectionLabel = isSupabaseMode() ? "Supabase" : "Demo local";
  const connectionDetail = isSupabaseMode() ? "Datos compartidos activos" : "Usando datos del navegador";
  const canManage = isSystemAdmin() || !isSupabaseMode();
  return `
    <section class="section">
      <section class="grid grid-4">
        ${renderMetric("Conexion", connectionLabel, connectionDetail)}
        ${renderMetric("Usuarios", users.length, `${internalUsers().length} internos activos`)}
        ${renderMetric("Marcas", brands.length, `${clients.length} clientes`)}
        ${renderMetric("OTs abiertas", openOrders.length, `${overdueOrders.length} vencidas`)}
      </section>
      ${renderProfile()}
      ${renderAdminUserManager(canManage)}
    </section>
  `;
}

function bindEvents() {
  bindDelegatedActionEvents();
  document.querySelectorAll("[data-module]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!canOpenModule(button.dataset.module)) {
        showToast("Esta vista no esta disponible en el workspace operativo");
        return;
      }
      state.mobileNavOpen = false;
      state.currentModule = button.dataset.module;
      if (state.currentModule !== "work-orders") {
        syncWorkOrderFormDraftFromForm();
        state.creatingWorkOrder = false;
        state.workOrderSubmitting = false;
        state.editingWorkOrderId = "";
        state.viewingWorkOrderId = "";
        state.focusedWorkOrderId = "";
        state.workOrderDraftPhases = [];
      }
      render();
    });
  });

  document.querySelectorAll(".js-brand-select").forEach((brandSelect) => {
    brandSelect.addEventListener("change", (event) => {
      syncWorkOrderFormDraftFromForm();
      state.currentBrandId = event.target.value;
      reconcileDashboardOrderBrandFilter();
      if (state.creatingWorkOrder) {
        const draft = ensureWorkOrderFormDraft();
        draft.selectedBrandId = event.target.value;
        persistWorkOrderFormDraft();
        render();
        return;
      }
      state.editingWorkOrderId = "";
      state.viewingWorkOrderId = "";
      state.focusedWorkOrderId = "";
      state.workOrderDraftPhases = [];
      resetWorkOrderFormDraft();
      const firstContent = brandItems(event.target.value)[0];
      state.selectedContentId = firstContent?.id || null;
      render();
    });
  });

  document.getElementById("brand-email-recipient-brand")?.addEventListener("change", (event) => {
    state.notificationBrandId = event.target.value;
    render();
  });

  document.querySelectorAll("[data-content]").forEach((button) => {
    button.addEventListener("click", () => {
      const contentId = button.dataset.content;
      const item = contentItems.find((contentItem) => contentItem.id === contentId);
      if (item) {
        if (OPERATIONS_MODE && !canOpenModule("content")) {
          showToast("Contenido no esta disponible en el workspace operativo");
          return;
        }
        state.currentBrandId = item.brandId;
        state.selectedContentId = item.id;
        state.currentModule = "content";
        render();
      }
    });
  });

  document.querySelectorAll("[data-brand-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      syncWorkOrderFormDraftFromForm();
      state.currentBrandId = button.dataset.brandJump;
      reconcileDashboardOrderBrandFilter();
      if (state.creatingWorkOrder) {
        const draft = ensureWorkOrderFormDraft();
        draft.selectedBrandId = state.currentBrandId;
        persistWorkOrderFormDraft();
        render();
        return;
      }
      state.editingWorkOrderId = "";
      state.viewingWorkOrderId = "";
      state.workOrderDraftPhases = [];
      resetWorkOrderFormDraft();
      const firstContent = brandItems(state.currentBrandId)[0];
      state.selectedContentId = firstContent?.id || null;
      render();
    });
  });

  document.querySelectorAll("[data-dashboard-kpi]").forEach((button) => {
    button.addEventListener("click", () => {
      state.dashboardKpiFilter = button.dataset.dashboardKpi || "open";
      render();
    });
  });

  document.querySelectorAll("[data-created-order-scope]").forEach((button) => {
    button.addEventListener("click", () => {
      state.dashboardOrderScope = button.dataset.createdOrderScope === "all" ? "all" : "created";
      render();
    });
  });

  document.querySelectorAll("[data-created-order-filter]").forEach((field) => {
    field.addEventListener("change", () => {
      const key = field.dataset.createdOrderFilter;
      if (!key) return;
      state.dashboardOrderFilters = {
        ...createdOrdersDashboardFilters(),
        [key]: key === "brand" && !isAllBrandsScope() ? "" : field.value,
      };
      render();
    });
  });

  document.querySelectorAll("[data-dashboard-brand]").forEach((button) => {
    button.addEventListener("click", () => {
      const brandId = button.dataset.dashboardBrand || "";
      state.dashboardBrandOpenId = state.dashboardBrandOpenId === brandId ? "" : brandId;
      render();
    });
  });

  document.querySelectorAll("[data-edit-user]").forEach((button) => {
    button.addEventListener("click", () => {
      state.adminEditingUserId = button.dataset.editUser;
      render();
    });
  });

  document.querySelectorAll("[data-content-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.contentView = button.dataset.contentView;
      const firstVisible = visibleContentItems()[0] || brandItems()[0];
      state.selectedContentId = firstVisible?.id || null;
      render();
    });
  });

  document.querySelectorAll("[data-config-section]").forEach((button) => {
    button.addEventListener("click", () => {
      state.brandConfigSection = button.dataset.configSection;
      render();
    });
  });

  document.querySelectorAll("[data-config-field]").forEach((field) => {
    field.addEventListener("input", () => {
      updateBrandConfigValue(field.dataset.configSectionKey, field.dataset.configField, field.value);
    });
    field.addEventListener("change", () => {
      showToast("Configuracion de marca guardada");
    });
  });

  document.querySelectorAll("[data-autosave]").forEach((field) => {
    field.addEventListener("change", () => {
      showToast("Auto-save guardo configuracion de marca");
    });
  });

  document.querySelectorAll(".assignee-search").forEach((input) => {
    input.addEventListener("input", () => {
      applyWorkOrderAssigneeSearchFilter(input);
    });
  });

  document.querySelectorAll("[data-ot-assignee]").forEach((input) => {
    input.addEventListener("change", () => {
      refreshAssigneeSelectedList();
      syncWorkOrderFormDraftFromForm();
    });
  });

  document.querySelectorAll("#ot-title, #ot-due-date, #ot-priority, #ot-status, #ot-category, #ot-art-count, #ot-description, #ot-subtasks, #ot-material-changes, #ot-email").forEach((input) => {
    input.addEventListener("input", syncWorkOrderFormDraftFromForm);
    input.addEventListener("change", syncWorkOrderFormDraftFromForm);
  });

  document.querySelectorAll("[data-phase-selection]").forEach((input) => {
    input.addEventListener("change", () => {
      toggleWorkOrderPhaseSelection(input.dataset.phaseSelection || "", input.checked);
    });
  });

  ["ot-category", "ot-priority"].forEach((fieldId) => {
    document.getElementById(fieldId)?.addEventListener("change", () => {
      syncWorkOrderFormDraftFromForm();
      refreshWorkOrderGuidancePanels();
    });
  });

  document.querySelectorAll("[data-phase-field=\"phaseKey\"]").forEach((select) => {
    select.addEventListener("change", () => {
      const row = select.closest("[data-phase-row]");
      const titleInput = row?.querySelector("[data-phase-field=\"title\"]");
      const descriptionInput = row?.querySelector("[data-phase-field=\"description\"]");
      const nextTitle = workOrderPhaseTitle(select.value);
      if (titleInput && (!titleInput.value || titleInput.value === "Nueva fase")) titleInput.value = nextTitle;
      if (descriptionInput && !descriptionInput.value) descriptionInput.value = defaultWorkOrderPhaseDescriptions[select.value] || "";
      syncWorkOrderFormDraftFromForm();
    });
  });

  document.querySelectorAll("[data-phase-field]").forEach((input) => {
    input.addEventListener("input", syncWorkOrderFormDraftFromForm);
    input.addEventListener("change", syncWorkOrderFormDraftFromForm);
  });

  document.querySelectorAll("[data-work-order-month]").forEach((input) => {
    input.addEventListener("change", () => {
      state.workOrderMonth = input.value;
      render();
    });
  });

  document.querySelectorAll("[data-dashboard-month]").forEach((input) => {
    input.addEventListener("change", () => {
      state.dashboardMonth = input.value;
      render();
    });
  });

  document.querySelectorAll("[data-dashboard-search]").forEach((input) => {
    input.addEventListener("input", () => {
      state.dashboardSearch = input.value;
      window.clearTimeout(input._lumenDashboardSearchTimer);
      input._lumenDashboardSearchTimer = window.setTimeout(render, 180);
    });
  });

  document.querySelectorAll("[data-report-filter]").forEach((input) => {
    input.addEventListener("change", () => {
      state[input.dataset.reportFilter] = input.value;
      if (input.dataset.reportFilter === "reportMonth" && input.value) {
        state.reportStartDate = "";
        state.reportEndDate = "";
      }
      if (["reportStartDate", "reportEndDate"].includes(input.dataset.reportFilter) && input.value) {
        state.reportMonth = "";
      }
      render();
    });
  });

  document.querySelectorAll("[data-production-planner-period]").forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.productionPlannerPeriod;
      const value = Number(input.value);
      if (key === "month") state.productionPlannerMonth = Math.min(12, Math.max(1, value || 7));
      if (key === "year") state.productionPlannerYear = Math.max(2026, value || 2026);
      state.productionPlannerEditingId = "";
      render();
    });
  });

  document.querySelectorAll("[data-production-planner-filter]").forEach((input) => {
    input.addEventListener("change", () => {
      state.productionPlannerFilters[input.dataset.productionPlannerFilter] = input.value;
      render();
    });
    if (input.dataset.productionPlannerFilter === "search") {
      input.addEventListener("input", () => {
        state.productionPlannerFilters.search = input.value;
        window.clearTimeout(input._lumenPlannerSearchTimer);
        input._lumenPlannerSearchTimer = window.setTimeout(render, 160);
      });
    }
  });

  document.querySelectorAll("[data-production-planner-brand-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.productionPlannerFilters.brand = button.dataset.productionPlannerBrandFilter || "";
      render();
    });
  });

  document.querySelector("[data-production-planner-archive-toggle]")?.addEventListener("change", (event) => {
    state.productionPlannerShowArchived = event.target.checked;
    render();
  });

  document.querySelectorAll("[data-workorder-filter]").forEach((input) => {
    input.addEventListener("change", () => {
      state.workOrderFilters[input.dataset.workorderFilter] = input.value;
      render();
    });
    if (input.dataset.workorderFilter === "search") {
      input.addEventListener("input", () => {
        state.workOrderFilters.search = input.value;
        window.clearTimeout(input._lumenSearchTimer);
        input._lumenSearchTimer = window.setTimeout(render, 180);
      });
    }
  });

  document.querySelectorAll("[data-workorder-quick-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.workorderQuickFilter;
      state.workOrderFilters.quick = state.workOrderFilters.quick === selected ? "" : selected;
      if (selected === "archived") state.showArchivedWorkOrders = state.workOrderFilters.quick === "archived";
      state.currentModule = "work-orders";
      render();
    });
  });

  document.querySelectorAll("[data-workorder-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.workOrderView = button.dataset.workorderView;
      state.workOrderGroupLimits = {};
      render();
    });
  });

  document.querySelectorAll("[data-workorder-show-more]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.workorderShowMore;
      state.workOrderGroupLimits[key] = workOrderGroupLimit(key) + 20;
      render();
    });
  });

  document.querySelectorAll("[data-calendar-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.calendarView = button.dataset.calendarView;
      render();
    });
  });

  document.querySelectorAll("[data-workorder-assignee-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.workOrderFilters.assignee = button.dataset.workorderAssigneeFilter;
      state.currentModule = "work-orders";
      render();
    });
  });

}

function refreshAssigneeSelectedList() {
  const container = document.querySelector(".assignee-selected-list");
  if (!container) return;
  const selectedIds = Array.from(document.querySelectorAll("[data-ot-assignee]:checked")).map((input) => input.value);
  if (!selectedIds.length) {
    container.innerHTML = `<span class="muted">Sin responsables seleccionados</span>`;
    return;
  }
  container.innerHTML = selectedIds
    .map((userId) => {
      const user = users.find((candidate) => candidate.id === userId);
      if (!user) return "";
      return `
        <span class="assignee-chip">
          <strong>${escapeHtml(user.name)}</strong>
          <small>${escapeHtml(roleLabels[user.role] || user.role)}</small>
        </span>
      `;
    })
    .join("");
}

function updateWorkOrderAssigneeSearchDraft(value = "") {
  const draft = state.workOrderFormDraft || ensureWorkOrderFormDraft();
  draft.assigneeSearch = value;
  draft.assignees = selectedWorkOrderAssigneeIdsFromForm();
  persistWorkOrderFormDraft();
}

function applyWorkOrderAssigneeSearchFilter(input) {
  const picker = input.closest(".assignee-picker") || document;
  const query = normalizeSearchText(input.value);
  const options = Array.from(picker.querySelectorAll("[data-assignee-option]"));
  let visibleCount = 0;
  options.forEach((option) => {
    const isMatch = !query || option.dataset.assigneeOption.includes(query);
    option.classList.toggle("is-filtered-out", !isMatch);
    if (isMatch) visibleCount += 1;
  });
  const noResults = picker.querySelector(".assignee-no-results");
  if (noResults) {
    noResults.classList.toggle("is-hidden", !query || visibleCount > 0);
  }
  updateWorkOrderAssigneeSearchDraft(input.value);
}

function refreshWorkOrderGuidancePanels() {
  const category = document.getElementById("ot-category")?.value || "diseno";
  const priority = document.getElementById("ot-priority")?.value || "medium";
  const planner = document.querySelector(".urgent-planner-panel");
  if (planner) {
    const next = document.createElement("div");
    next.innerHTML = renderUrgentPlannerPanel(category, priority);
    const replacement = next.firstElementChild;
    planner.replaceWith(replacement);
  }
}

function focusWorkOrderAi() {
  if (!ENABLE_AI_ASSISTANT) {
    showToast("Asistente IA desactivado para piloto");
    return;
  }
  const globalAssistant = document.getElementById("ai-order-brief");
  if (globalAssistant) {
    globalAssistant.scrollIntoView({ block: "center", behavior: "smooth" });
    globalAssistant.focus();
    showToast("Describe la OT y para quien es");
    return;
  }
  document.querySelector(".ai-order-assistant")?.scrollIntoView({ block: "center", behavior: "smooth" });
  document.getElementById("ot-ai-brief")?.focus();
}

function openCreateWorkOrder() {
  if (!canCreateWorkOrders()) {
    state.currentModule = "dashboard";
    state.creatingWorkOrder = false;
    state.workOrderSubmitting = false;
    showToast("Tu rol puede consultar y avanzar tus fases, pero no crear OTs.");
    render();
    return;
  }
  state.currentModule = "work-orders";
  state.showArchivedWorkOrders = false;
  state.editingWorkOrderId = "";
  state.viewingWorkOrderId = "";
  state.focusedWorkOrderId = "";
  state.workOrderSubmitting = false;
  const draft = ensureWorkOrderFormDraft();
  state.workOrderUsesPhases = state.workOrderDraftPhases.length > 0;
  state.workOrderPhasesExpanded = Boolean(draft.phasesExpanded);
  state.creatingWorkOrder = true;
  render();
  if (ENABLE_AI_ASSISTANT) {
    window.setTimeout(() => focusWorkOrderAi(), 0);
  }
}

function closeCreateWorkOrder() {
  syncWorkOrderFormDraftFromForm();
  if (hasMeaningfulWorkOrderDraft() && !window.confirm("¿Descartar el borrador de esta OT?")) {
    return;
  }
  state.creatingWorkOrder = false;
  state.workOrderSubmitting = false;
  state.workOrderDraftPhases = [];
  resetWorkOrderFormDraft();
  render();
}

function setWorkOrderCreateSubmitting(isSubmitting) {
  state.workOrderSubmitting = Boolean(isSubmitting);
  const button = document.querySelector("[data-action=\"create-work-order\"]");
  if (!button) return;
  button.disabled = state.workOrderSubmitting;
  button.setAttribute("aria-busy", state.workOrderSubmitting ? "true" : "false");
  button.textContent = state.workOrderSubmitting ? "Creando..." : "Crear OT";
}

function captureFormScrollPosition() {
  const modal = document.querySelector(".work-order-create-modal");
  return {
    modalTop: modal ? modal.scrollTop : null,
    windowTop: window.scrollY,
  };
}

function restoreFormScrollPosition(position) {
  window.requestAnimationFrame(() => {
    const modal = document.querySelector(".work-order-create-modal");
    if (modal && position?.modalTop !== null) {
      modal.scrollTop = position.modalTop;
      return;
    }
    if (position) window.scrollTo({ top: position.windowTop || 0, behavior: "auto" });
  });
}

function clearWorkOrderFilters() {
  state.workOrderFilters = { search: "", assignee: "", status: "", priority: "", due: "", quick: "" };
  state.showArchivedWorkOrders = false;
  render();
}

function syncDraftPhasesFromForm() {
  syncWorkOrderFormDraftFromForm();
}

function persistWorkOrderPhaseSelection() {
  state.workOrderDraftPhases = normalizeWorkOrderPhases(state.workOrderDraftPhases).map((phase, index) => ({
    ...phase,
    sortOrder: index,
  }));
  state.workOrderUsesPhases = state.workOrderDraftPhases.length > 0;
  const draft = state.workOrderFormDraft || emptyWorkOrderFormDraft();
  state.workOrderFormDraft = draft;
  draft.usesPhases = state.workOrderUsesPhases;
  draft.phasesExpanded = state.workOrderPhasesExpanded;
  draft.phases = state.workOrderDraftPhases;
  draft.phaseSelectionVersion = 2;
  persistWorkOrderFormDraft();
}

function toggleWorkOrderPhasesEditor() {
  const scrollPosition = captureFormScrollPosition();
  syncWorkOrderFormDraftFromForm();
  state.workOrderPhasesExpanded = !state.workOrderPhasesExpanded;
  persistWorkOrderPhaseSelection();
  render();
  restoreFormScrollPosition(scrollPosition);
  if (state.workOrderPhasesExpanded) {
    window.requestAnimationFrame(() => document.querySelector("[data-phase-selection]")?.focus());
  }
}

function toggleWorkOrderPhaseSelection(phaseKey, isSelected) {
  const catalogPhase = workOrderPhaseCatalog.find((phase) => phase.key === phaseKey);
  if (!catalogPhase) return;
  const scrollPosition = captureFormScrollPosition();
  syncWorkOrderFormDraftFromForm();
  const existingIndex = state.workOrderDraftPhases.findIndex((phase) => phase.phaseKey === phaseKey);
  if (isSelected && existingIndex < 0) {
    state.workOrderDraftPhases.push(
      normalizedPhaseFromValues(
        {
          phaseKey,
          title: catalogPhase.title,
          description: defaultWorkOrderPhaseDescriptions[phaseKey] || "",
          assignedTo: "",
          status: "pending",
          dueDate: document.getElementById("ot-due-date")?.value || "",
          sortOrder: workOrderPhaseCatalog.findIndex((phase) => phase.key === phaseKey),
        },
        state.workOrderDraftPhases.length,
      ),
    );
  } else if (!isSelected && existingIndex >= 0) {
    state.workOrderDraftPhases.splice(existingIndex, 1);
  }
  state.workOrderDraftPhases.sort((left, right) => {
    const leftIndex = workOrderPhaseCatalog.findIndex((phase) => phase.key === left.phaseKey);
    const rightIndex = workOrderPhaseCatalog.findIndex((phase) => phase.key === right.phaseKey);
    const safeLeft = leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const safeRight = rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex;
    return safeLeft - safeRight;
  });
  persistWorkOrderPhaseSelection();
  render();
  restoreFormScrollPosition(scrollPosition);
}

function addWorkOrderPhase() {
  const scrollPosition = captureFormScrollPosition();
  syncWorkOrderFormDraftFromForm();
  state.workOrderPhasesExpanded = true;
  state.workOrderDraftPhases.push(
    normalizedPhaseFromValues(
      {
        phaseKey: "custom",
        title: "Nueva fase",
        description: "",
        assignedTo: "",
        status: "pending",
        dueDate: document.getElementById("ot-due-date")?.value || "",
        sortOrder: state.workOrderDraftPhases.length,
      },
      state.workOrderDraftPhases.length,
    ),
  );
  persistWorkOrderPhaseSelection();
  render();
  restoreFormScrollPosition(scrollPosition);
}

function removeWorkOrderPhase(index) {
  const scrollPosition = captureFormScrollPosition();
  syncWorkOrderFormDraftFromForm();
  state.workOrderDraftPhases.splice(Number(index), 1);
  state.workOrderDraftPhases = normalizeWorkOrderPhases(state.workOrderDraftPhases).map((phase, phaseIndex) => ({
    ...phase,
    sortOrder: phaseIndex,
  }));
  persistWorkOrderPhaseSelection();
  render();
  restoreFormScrollPosition(scrollPosition);
}

function focusUrgentOrders() {
  document.querySelector("[data-urgent-orders-panel]")?.scrollIntoView({ block: "center", behavior: "smooth" });
}

function draftWorkOrderFromAiComposer() {
  if (!ENABLE_AI_ASSISTANT) {
    showToast("Asistente IA desactivado para piloto");
    return;
  }
  const brief = document.getElementById("ai-order-brief")?.value.trim() || "";
  const target = document.getElementById("ai-order-target")?.value.trim() || "";
  const selectedBrandId = document.getElementById("ai-order-brand")?.value || "";
  const prompt = [brief, target ? `Para: ${target}` : ""].filter(Boolean).join("\n");

  if (!prompt.trim()) {
    showToast("Describe la orden para que el asistente arme el borrador");
    return;
  }

  const inferredBrand = selectedBrandId
    ? brands.find((brand) => brand.id === selectedBrandId)
    : isAllBrandsScope()
      ? inferBrandFromAiText(prompt)
      : getBrand();

  if (!inferredBrand) {
    showToast("No detecte la marca. Elige una marca o mencionala en la solicitud.");
    document.getElementById("ai-order-brand")?.focus();
    return;
  }

  state.currentModule = "work-orders";
  state.currentBrandId = inferredBrand.id;
  state.editingWorkOrderId = "";
  state.viewingWorkOrderId = "";
  state.focusedWorkOrderId = "";
  render();

  window.setTimeout(() => {
    const formPrompt = document.getElementById("ot-ai-brief");
    if (formPrompt) formPrompt.value = prompt;
    fillWorkOrderWithAi(prompt);
    document.querySelector(".work-order-form-band")?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, 80);
}

function bindAuthEvents() {
  bindDelegatedActionEvents();
}

function bindDelegatedActionEvents() {
  bindDocumentInteractionEvents();
}

function beginWorkOrderPhaseDrag(active, pointerY) {
  const cardRect = active.card.getBoundingClientRect();
  const ghost = document.createElement("div");
  const ghostNumber = document.createElement("span");
  const ghostTitle = document.createElement("strong");
  const placeholder = document.createElement("div");

  ghost.className = `phase-reorder-ghost ${active.card.classList.contains("done") ? "done" : ""}`;
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.left = `${cardRect.left}px`;
  ghost.style.top = `${cardRect.top}px`;
  ghost.style.width = `${cardRect.width}px`;
  ghostNumber.className = "phase-dot";
  ghostNumber.textContent = active.card.querySelector(".phase-dot")?.textContent || "";
  ghostTitle.textContent = active.card.querySelector("strong")?.textContent || "Fase";
  ghost.append(ghostNumber, ghostTitle);

  placeholder.className = "phase-reorder-placeholder";
  placeholder.setAttribute("aria-hidden", "true");
  active.card.classList.add("is-drag-source");
  active.track.classList.add("is-reordering");
  active.handle.classList.add("is-grabbing");
  active.handle.setAttribute("aria-pressed", "true");
  document.body.classList.add("is-phase-reordering");
  document.body.appendChild(ghost);

  active.dragging = true;
  active.ghost = ghost;
  active.placeholder = placeholder;
  active.ghost.style.transform = `translate3d(0, ${pointerY - active.startY}px, 0)`;
}

function updateWorkOrderPhaseDropTarget(active, pointerY) {
  const cards = Array.from(active.track.querySelectorAll(".phase-progress-step"))
    .filter((card) => card !== active.card);
  const beforeCard = cards.find((card) => {
    const rect = card.getBoundingClientRect();
    return pointerY < rect.top + rect.height / 2;
  });
  if (beforeCard) {
    active.toIndex = cards.indexOf(beforeCard);
    active.track.insertBefore(active.placeholder, beforeCard);
  } else {
    active.toIndex = cards.length;
    active.track.appendChild(active.placeholder);
  }

  const scrollPanel = active.track.closest(".drawer-panel");
  if (!scrollPanel) return;
  const panelRect = scrollPanel.getBoundingClientRect();
  if (pointerY < panelRect.top + 56) scrollPanel.scrollBy({ top: -14 });
  if (pointerY > panelRect.bottom - 56) scrollPanel.scrollBy({ top: 14 });
}

function clearWorkOrderPhaseDrag(active = activeWorkOrderPhaseDrag) {
  if (!active) return;
  try {
    if (active.handle.hasPointerCapture?.(active.pointerId)) active.handle.releasePointerCapture(active.pointerId);
  } catch {
    // Pointer capture may already have ended when the browser cancels a touch gesture.
  }
  active.card.classList.remove("is-drag-source");
  active.track.classList.remove("is-reordering");
  active.handle.classList.remove("is-grabbing");
  active.handle.setAttribute("aria-pressed", "false");
  active.ghost?.remove();
  active.placeholder?.remove();
  document.body.classList.remove("is-phase-reordering");
  activeWorkOrderPhaseDrag = null;
}

function handleWorkOrderPhasePointerDown(event) {
  const handle = event.target.closest?.("[data-phase-reorder-handle]");
  if (!handle || activeWorkOrderPhaseDrag || event.isPrimary === false) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  const card = handle.closest(".phase-progress-step");
  const track = handle.closest("[data-phase-reorder-track]");
  const order = findWorkOrderByAnyId(track?.dataset.orderId || "");
  if (!card || !track || !canReorderWorkOrderPhases(order)) return;

  const initialPhaseIds = workOrderPhases(order).map(phaseReorder.phaseIdentity);
  const phaseId = card.dataset.phaseId || "";
  const fromIndex = initialPhaseIds.indexOf(phaseId);
  if (fromIndex < 0) return;

  event.preventDefault();
  handle.focus({ preventScroll: true });
  handle.setPointerCapture?.(event.pointerId);
  activeWorkOrderPhaseDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    phaseId,
    orderId: order.id,
    initialPhaseIds,
    fromIndex,
    toIndex: fromIndex,
    handle,
    card,
    track,
    dragging: false,
    ghost: null,
    placeholder: null,
  };
}

function handleWorkOrderPhasePointerMove(event) {
  const active = activeWorkOrderPhaseDrag;
  if (!active || event.pointerId !== active.pointerId) return;
  const distance = Math.hypot(event.clientX - active.startX, event.clientY - active.startY);
  if (!active.dragging && distance < 5) return;
  event.preventDefault();
  if (!active.dragging) beginWorkOrderPhaseDrag(active, event.clientY);
  active.ghost.style.transform = `translate3d(0, ${event.clientY - active.startY}px, 0)`;
  updateWorkOrderPhaseDropTarget(active, event.clientY);
}

function handleWorkOrderPhasePointerUp(event) {
  const active = activeWorkOrderPhaseDrag;
  if (!active || event.pointerId !== active.pointerId) return;
  let orderedPhaseIds = [];
  if (active.dragging) {
    try {
      orderedPhaseIds = phaseReorder.phaseOrderAfterDrag({
        phaseIds: active.initialPhaseIds,
        fromIndex: active.fromIndex,
        toIndex: active.toIndex,
        dragging: true,
      });
    } catch (error) {
      console.warn("[Lumen phases] invalid drop target", error);
    }
  }
  const orderId = active.orderId;
  clearWorkOrderPhaseDrag(active);
  if (orderedPhaseIds.length) reorderWorkOrderPhases(orderId, orderedPhaseIds);
}

function handleWorkOrderPhasePointerCancel(event) {
  if (activeWorkOrderPhaseDrag && event.pointerId === activeWorkOrderPhaseDrag.pointerId) {
    clearWorkOrderPhaseDrag();
  }
}

function handleWorkOrderPhaseReorderKeydown(event) {
  if (event.key === "Escape" && activeWorkOrderPhaseDrag) {
    event.preventDefault();
    clearWorkOrderPhaseDrag();
    return;
  }
  const handle = event.target.closest?.("[data-phase-reorder-handle]");
  if (!handle || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
  const track = handle.closest("[data-phase-reorder-track]");
  const card = handle.closest(".phase-progress-step");
  const order = findWorkOrderByAnyId(track?.dataset.orderId || "");
  if (!track || !card || !canReorderWorkOrderPhases(order)) return;

  const phaseIds = workOrderPhases(order).map(phaseReorder.phaseIdentity);
  const currentIndex = phaseIds.indexOf(card.dataset.phaseId || "");
  const nextIndex = event.key === "ArrowUp" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= phaseIds.length) return;
  event.preventDefault();
  const [movedPhaseId] = phaseIds.splice(currentIndex, 1);
  phaseIds.splice(nextIndex, 0, movedPhaseId);
  reorderWorkOrderPhases(order.id, phaseIds);
}

function bindDocumentInteractionEvents() {
  if (typeof window === "undefined" || window.__lumenDocumentInteractionsAttached) return;
  document.addEventListener("click", handleDocumentActionClick, true);
  document.addEventListener("input", handleWorkOrderMentionInput);
  document.addEventListener("keydown", handleWorkOrderMentionKeydown);
  document.addEventListener("keydown", handleWorkOrderPhaseReorderKeydown);
  document.addEventListener("pointerdown", handleWorkOrderPhasePointerDown);
  document.addEventListener("pointermove", handleWorkOrderPhasePointerMove, { passive: false });
  window.addEventListener("pointerup", handleWorkOrderPhasePointerUp, true);
  window.addEventListener("pointercancel", handleWorkOrderPhasePointerCancel, true);
  window.addEventListener("popstate", handleWorkOrderNavigationPopState);
  window.__lumenDocumentInteractionsAttached = true;
  debugInteraction("document-action-listener:bound", {
    capture: true,
  });
}

async function handleDocumentActionClick(event) {
  const actionTarget = event.target.closest?.("[data-action]");
  if (!actionTarget) return;
  const action = actionTarget.dataset.action;

  if (action === "toggle-mobile-nav" || action === "close-mobile-nav") {
    event.preventDefault();
    event.stopPropagation();
    state.mobileNavOpen = action === "toggle-mobile-nav" ? !state.mobileNavOpen : false;
    render();
    return;
  }

  if (action === "toggle-created-orders-filters") {
    event.preventDefault();
    event.stopPropagation();
    state.dashboardOrderFiltersOpen = !state.dashboardOrderFiltersOpen;
    render();
    return;
  }

  if (action === "clear-created-orders-filters") {
    event.preventDefault();
    event.stopPropagation();
    state.dashboardOrderFilters = {
      brand: "",
      status: "",
      priority: "",
      createdDate: "",
      dueDate: "",
      archive: "active",
    };
    render();
    return;
  }

  if (action === "set-phase-status") {
    event.preventDefault();
    event.stopPropagation();

    if (!document.getElementById("app")?.contains(actionTarget)) return;
    if (actionTarget.disabled || actionTarget.getAttribute("aria-disabled") === "true") return;

    const phaseId = actionTarget.dataset.phaseId || "";
    const nextStatus = actionTarget.dataset.nextStatus || "";
    if (!phaseId || !nextStatus) {
      debugInteraction("phase-status:set-invalid", {
        phaseId,
        nextStatus,
        outerHTML: actionTarget.outerHTML,
      });
      showToast("No se pudo identificar el estado seleccionado.", "error");
      return;
    }
    debugInteraction("phase-status:set-click", {
      phaseId,
      nextStatus,
      tagName: actionTarget.tagName,
      type: actionTarget.type,
      href: actionTarget.getAttribute("href"),
      insideForm: Boolean(actionTarget.closest("form")),
      parentAction: actionTarget.parentElement?.closest?.("[data-action]")?.dataset?.action || "",
    });
    try {
      await updateWorkOrderPhaseStatus(phaseId, nextStatus);
    } catch (error) {
      console.warn("[Lumen phase] status button failed", error);
      showToast(error.message || "No se pudo actualizar la fase");
    }
    return;
  }

  if (!document.getElementById("app")?.contains(actionTarget)) return;
  if (event.target.closest('select, option, input, textarea, [contenteditable="true"]')) return;
  if (actionTarget.disabled || actionTarget.getAttribute("aria-disabled") === "true") return;

  event.preventDefault();
  const id = actionTarget.dataset.id || actionTarget.dataset.orderId || "";
  debugInteraction("click:caught", {
    action,
    id,
    phaseId: actionTarget.dataset.phaseId || id || "",
    tag: actionTarget.tagName,
    disabled: Boolean(actionTarget.disabled),
    pointerEvents: window.getComputedStyle(actionTarget).pointerEvents,
  });
  handleAction(action, id, actionTarget).catch((error) => {
    console.warn("[Lumen interaction] action failed", { action, id, error });
    showToast(error.message || "No se pudo completar la acción");
  });
}

async function handleAction(action, id, actionElement = null) {
  const actionMap = {
    login: () => loginWithPassword(),
    "reset-password-email": () => sendPasswordResetEmail(),
    "update-recovery-password": () => updatePasswordFromRecovery(),
    "change-own-password": () => changeOwnPassword(),
    logout: () => logout(),
    "approve-content": () => updateContentStatus(id, "approved", "Pieza aprobada"),
    "request-changes": () =>
      updateContentStatus(id, "changes_requested", "Cambios solicitados al equipo"),
    "move-final": () => updateContentStage(id, "final", "Pieza movida a etapa final"),
    "move-scheduled": () => updateContentStage(id, "scheduled", "Pieza programada dentro del calendario"),
    "add-comment": () => addContentComment(id),
    "approve-asset": () => approveAsset(id),
    "sync-asset": () => showToast("Preview sincronizado desde Canva"),
    "send-client-review": () => sendClientReview(),
    "new-content": () => createContent(),
    "compose-concept": () => createContent("Concepto nuevo"),
    "copy-to-content": () => createContent("Caption generado por IA"),
    "generate-copy": () => showToast("Opciones generadas con el contexto de marca"),
    "idea-to-content": () => createContent("Idea de campana"),
    "new-order": () => showToast("Nueva OT lista para conectar a contenido"),
    "upload-csv": () => showToast("CSV cargado y convertido en report_snapshots"),
    "export-pdf": () => showToast("Reporte mensual PDF preparado"),
    "use-config-content": () => {
      state.currentModule = "content";
      showToast("Contenido ahora usa esta configuracion de marca");
    },
    "use-config-ai": () => {
      if (ENABLE_AI_ASSISTANT && canOpenModule("copywriting")) {
        state.currentModule = "copywriting";
        showToast("IA lista con el contexto actualizado de marca");
      } else {
        showToast("Asistente IA desactivado para piloto");
      }
    },
    "export-brand-config": () => showToast("Resumen de marca preparado para compartir internamente"),
    "fill-work-order-ai": () => fillWorkOrderWithAi(),
    "draft-work-order-ai": () => draftWorkOrderFromAiComposer(),
    "focus-work-order-ai": () => focusWorkOrderAi(),
    "open-create-work-order": () => openCreateWorkOrder(),
    "close-create-work-order": () => closeCreateWorkOrder(),
    "clear-work-order-filters": () => clearWorkOrderFilters(),
    "toggle-work-order-phases": () => toggleWorkOrderPhasesEditor(),
    "add-work-order-phase": () => addWorkOrderPhase(),
    "remove-work-order-phase": () => removeWorkOrderPhase(id),
    "complete-work-order-phase": () => completeWorkOrderPhase(id),
    "add-work-order-phase-comment": () => addWorkOrderPhaseComment(id),
    "publish-work-order-comment": () => publishWorkOrderComment(id, "", actionElement),
    "reply-work-order-comment": () => openWorkOrderCommentReply(id),
    "cancel-work-order-comment-reply": () => closeWorkOrderCommentReply(),
    "publish-work-order-comment-reply": () => publishWorkOrderComment("", id, actionElement),
    "resolve-work-order-comment": () => resolveWorkOrderComment(id, actionElement),
    "select-work-order-mention": () => selectWorkOrderMention(id, actionElement),
    "remove-work-order-mention": () => removeWorkOrderMention(id, actionElement),
    "toggle-mention-inbox": () => toggleWorkOrderMentionInbox(),
    "close-mention-inbox": () => closeWorkOrderMentionInbox(),
    "open-work-order-mention": () => openWorkOrderMention(id, actionElement),
    "focus-urgent-orders": () => focusUrgentOrders(),
    "optimize-work-order-urgency": () => optimizeWorkOrderUrgency(),
    "create-work-order": () => createWorkOrderFromForm(),
    "view-work-order": () => viewWorkOrder(id),
    "close-work-order-detail": () => closeWorkOrderDetail(),
    "edit-work-order": () => editWorkOrder(id),
    "cancel-edit-work-order": () => cancelEditWorkOrder(),
    "update-work-order": () => updateWorkOrderFromForm(),
    "update-order-status": () => updateOrderStatusFromSelect(id),
    "set-order-status": () => setOrderStatusFromButton(id),
    "complete-work-order-without-phases": () => requestNoPhaseOrderStatusChange(id, "completed"),
    "request-no-phase-order-status": () => requestNoPhaseOrderStatusChange(id, actionElement?.dataset?.nextStatus || ""),
    "confirm-no-phase-order-status": () => confirmNoPhaseOrderStatusChange(),
    "cancel-no-phase-order-status": () => closeNoPhaseOrderStatusDialog(),
    "advance-order": () => advanceWorkOrder(id),
    "archive-work-order": () => archiveWorkOrder(id),
    "unarchive-work-order": () => unarchiveWorkOrder(id),
    "toggle-archived-work-orders": () => toggleArchivedWorkOrders(),
    "upload-order-materials": () => uploadOrderMaterials(id),
    "open-work-order-file": () => openWorkOrderFile(id),
    "delete-work-order-file": () => deleteWorkOrderFile(id),
    "send-urgent-alert": () => sendUrgentWorkOrderAlert(id),
    "mark-work-order-urgent": () => toggleWorkOrderUrgency(id),
    "unmark-work-order-urgent": () => toggleWorkOrderUrgency(id),
    "preview-weekly-digest": () => previewWeeklyDigest(),
    "queue-daily-digest": () => queueDailyDigest(),
    "queue-weekly-digest": () => queueWeeklyDigest(),
    "send-email-queue": () => sendEmailQueue(),
    "run-daily-digest-now": () => runDailyDigestNow(),
    "run-weekly-digest-now": () => runWeeklyDigestNow(),
    "new-production-planner-item": () => openProductionPlannerItem(),
    "edit-production-planner-item": () => openProductionPlannerItem(id),
    "cancel-production-planner-edit": () => cancelProductionPlannerEdit(),
    "save-production-planner-item": () => saveProductionPlannerItem(id),
    "archive-production-planner-item": () => archiveProductionPlannerItem(id, true),
    "restore-production-planner-item": () => archiveProductionPlannerItem(id, false),
    "duplicate-production-planner-month": () => duplicatePreviousProductionPlannerMonth(),
    "clear-production-planner-filters": () => clearProductionPlannerFilters(),
    "save-brand-email-recipients": () => saveBrandEmailRecipients(),
    "clear-brand-email-recipients": () => clearBrandEmailRecipients(),
    "download-report-pdf": () => downloadReportPdf(),
    "download-workspace-backup": () => downloadWorkspaceBackup(),
    "download-workspace-json": () => downloadWorkspaceJsonBackup(),
    "open-create-brand": () => openCreateBrand(),
    "close-create-brand": () => closeCreateBrand(),
    "save-brand": () => saveBrand(),
    "new-admin-user": () => newAdminUser(),
    "save-admin-user": () => saveAdminUser(),
    "deactivate-admin-user": () => setAdminUserActive(id, false),
    "activate-admin-user": () => setAdminUserActive(id, true),
  };

  if (actionMap[action]) {
    await actionMap[action]();
  }
}

function openProductionPlannerItem(id = "") {
  if (!canAccessProductionPlanner()) {
    showToast("No tienes acceso al Planificador de producción");
    return;
  }
  state.productionPlannerEditingId = id || "new";
  render();
}

function cancelProductionPlannerEdit() {
  state.productionPlannerEditingId = "";
  render();
}

function clearProductionPlannerFilters() {
  state.productionPlannerFilters = {
    search: "",
    brand: "",
    medium: "",
    status: "",
    accountOwner: "",
    digitalOwner: "",
    responsible: "",
  };
  state.productionPlannerShowArchived = false;
  render();
}

function readProductionPlannerForm(id = "") {
  return {
    id,
    month: Number(state.productionPlannerMonth),
    year: Number(state.productionPlannerYear),
    brand: document.getElementById("planner-brand")?.value.trim() || "",
    medium: document.getElementById("planner-medium")?.value.trim() || "",
    deliverables: document.getElementById("planner-deliverables")?.value.trim() || "",
    talentRequirement: document.getElementById("planner-talent-requirement")?.value || "",
    rawMatrixStatus: document.getElementById("planner-raw-matrix-status")?.value || "",
    rawMatrixDueDate: document.getElementById("planner-raw-matrix-due-date")?.value || "",
    productionDate: document.getElementById("planner-production-date")?.value || "",
    status: document.getElementById("planner-status")?.value || "Pendiente",
    accountOwner: document.getElementById("planner-account-owner")?.value.trim() || "",
    digitalOwner: document.getElementById("planner-digital-owner")?.value.trim() || "",
    additionalResponsibleIds: Array.from(document.querySelectorAll("[data-production-planner-assignee]:checked")).map((input) => input.value),
    notes: document.getElementById("planner-notes")?.value.trim() || "",
  };
}

async function saveProductionPlannerItem(id = "") {
  if (!canAccessProductionPlanner()) {
    showToast("No tienes acceso al Planificador de producción");
    return;
  }
  const existingItem = productionPlannerItems.find((item) => item.id === id);
  const values = readProductionPlannerForm(existingItem?.id || "");
  if (!values.brand) {
    showToast("Escribe la marca para guardar la producción");
    return;
  }
  const previousResponsibleIds = existingItem ? productionPlannerResponsibleIds(existingItem) : [];
  const nextResponsibleIds = productionPlannerResponsibleIds(values);
  const newResponsibleIds = nextResponsibleIds.filter((userId) => !previousResponsibleIds.includes(userId));
  let savedItem = null;

  if (isSupabaseMode()) {
    const payload = {
      ...productionPlannerItemToDb(values),
      updated_by: dataState.session?.user?.id || null,
    };
    if (existingItem) {
      const { data, error } = await supabaseClient
        .from("production_planner_items")
        .update(payload)
        .eq("id", existingItem.id)
        .select()
        .single();
      if (error) {
        const message = error.message || "";
        showToast(message.includes("additional_responsible_ids")
          ? "Falta ejecutar supabase/patch_production_planner_notifications.sql para responsables del Planificador"
          : `No se pudo guardar: ${message}`);
        return;
      }
      savedItem = mapDbProductionPlannerItem(data);
    } else {
      const { data, error } = await supabaseClient
        .from("production_planner_items")
        .insert({ ...payload, created_by: dataState.session?.user?.id || null })
        .select()
        .single();
      if (error) {
        const message = error.message || "";
        showToast(message.includes("additional_responsible_ids")
          ? "Falta ejecutar supabase/patch_production_planner_notifications.sql para responsables del Planificador"
          : `No se pudo crear: ${message}`);
        return;
      }
      savedItem = mapDbProductionPlannerItem(data);
    }
    if (newResponsibleIds.length) {
      const emailResult = await queueProductionPlannerAssignmentEmails(
        savedItem || values,
        newResponsibleIds,
        existingItem ? "Producción actualizada" : "Nueva producción asignada",
      );
      if (emailResult.error) showToast(`Producción guardada, pero fallo email: ${emailResult.error.message}`);
      else if (emailResult.count) await invokeEmailFunction("email-worker", (data) => `Producción guardada y correos revisados: ${data?.processed ?? 0}`, {}, { allowCreators: true });
    }
    await loadSupabaseData();
  } else if (existingItem) {
    Object.assign(existingItem, values, { updatedAt: new Date().toISOString() });
    saveProductionPlannerItems();
  } else {
    productionPlannerItems.unshift({
      ...values,
      id: `planner-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    });
    saveProductionPlannerItems();
  }

  state.productionPlannerEditingId = "";
  showToast("Planificador de producción guardado");
  render();
}

async function archiveProductionPlannerItem(id, shouldArchive) {
  if (!canAccessProductionPlanner()) {
    showToast("No tienes acceso al Planificador de producción");
    return;
  }
  const item = productionPlannerItems.find((plannerItem) => plannerItem.id === id);
  if (!item) return;
  const archivedAt = shouldArchive ? new Date().toISOString() : null;

  if (isSupabaseMode()) {
    const { error } = await supabaseClient
      .from("production_planner_items")
      .update({ archived_at: archivedAt, updated_by: dataState.session?.user?.id || null })
      .eq("id", item.id);
    if (error) {
      showToast(`No se pudo ${shouldArchive ? "archivar" : "restaurar"}: ${error.message}`);
      return;
    }
    await loadSupabaseData();
  } else {
    item.archivedAt = archivedAt;
    item.updatedAt = new Date().toISOString();
    saveProductionPlannerItems();
  }
  showToast(shouldArchive ? "Producción archivada" : "Producción restaurada");
  render();
}

async function duplicatePreviousProductionPlannerMonth() {
  if (!canAccessProductionPlanner()) {
    showToast("No tienes acceso al Planificador de producción");
    return;
  }
  const currentMonth = Number(state.productionPlannerMonth);
  const currentYear = Number(state.productionPlannerYear);
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const sourceItems = productionPlannerItems.filter((item) => Number(item.month) === previousMonth && Number(item.year) === previousYear && !item.archivedAt);
  if (!sourceItems.length) {
    showToast(`No hay filas activas en ${productionPlannerPeriodLabel(previousMonth, previousYear)} para duplicar`);
    return;
  }
  const existingCount = productionPlannerItems.filter((item) => Number(item.month) === currentMonth && Number(item.year) === currentYear && !item.archivedAt).length;
  if (existingCount && !window.confirm(`Ya hay ${existingCount} filas activas en ${productionPlannerPeriodLabel()}. ¿Duplicar de todos modos?`)) return;

  const copies = sourceItems.map((item) => ({
    month: currentMonth,
    year: currentYear,
    brand: item.brand,
    medium: item.medium,
    deliverables: item.deliverables,
    talentRequirement: item.talentRequirement,
    rawMatrixStatus: item.rawMatrixStatus ? "Pendiente" : "",
    rawMatrixDueDate: "",
    productionDate: "",
    status: "Pendiente",
    accountOwner: item.accountOwner,
    digitalOwner: item.digitalOwner,
    additionalResponsibleIds: item.additionalResponsibleIds || [],
    notes: item.notes,
  }));

  if (isSupabaseMode()) {
    const payload = copies.map((item) => ({
      ...productionPlannerItemToDb(item),
      created_by: dataState.session?.user?.id || null,
      updated_by: dataState.session?.user?.id || null,
    }));
    const { error } = await supabaseClient.from("production_planner_items").insert(payload);
    if (error) {
      showToast(`No se pudo duplicar el mes: ${error.message}`);
      return;
    }
    await loadSupabaseData();
  } else {
    productionPlannerItems.unshift(
      ...copies.map((item, index) => ({
        ...item,
        id: `planner-copy-${Date.now()}-${index}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archivedAt: null,
      })),
    );
    saveProductionPlannerItems();
  }
  showToast(`Mes anterior duplicado en ${productionPlannerPeriodLabel()}`);
  render();
}

async function loginWithPassword() {
  if (!isSupabaseMode()) return;
  const email = document.getElementById("login-email")?.value.trim();
  const password = document.getElementById("login-password")?.value;
  if (!email || !password) {
    dataState.error = "Escribe email y password";
    render();
    return;
  }

  dataState.loading = true;
  dataState.error = "";
  render();
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    dataState.loading = false;
    dataState.error = error.message;
    render();
    return;
  }
  try {
    dataState.session = data?.session || (await supabaseClient.auth.getSession()).data?.session || null;
    if (dataState.session) {
      await loadSupabaseData();
      applyInitialRouteParams();
    }
    dataState.error = "";
  } catch (loadError) {
    dataState.error = loadError.message || "No se pudo cargar tu perfil";
  } finally {
    dataState.loading = false;
    render();
  }
}

async function sendPasswordResetEmail() {
  if (!isSupabaseMode()) return;
  const email = document.getElementById("login-email")?.value.trim();
  if (!email || !email.includes("@")) {
    dataState.error = "Escribe tu email y luego toca Olvide mi password";
    render();
    return;
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: getAppBaseUrl(),
  });
  if (error) {
    dataState.error = error.message;
    render();
    return;
  }

  dataState.error = "";
  showToast("Te enviamos un correo para cambiar tu password");
}

async function updatePasswordFromRecovery() {
  if (!isSupabaseMode()) return;
  const password = document.getElementById("new-password")?.value || "";
  const confirm = document.getElementById("confirm-password")?.value || "";
  if (password.length < 8) {
    dataState.error = "El password debe tener minimo 8 caracteres";
    render();
    return;
  }
  if (password !== confirm) {
    dataState.error = "Los passwords no coinciden";
    render();
    return;
  }

  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) {
    dataState.error = error.message;
    render();
    return;
  }

  dataState.passwordResetMode = false;
  dataState.error = "";
  showToast("Password actualizado");
}

async function changeOwnPassword() {
  if (!isSupabaseMode()) {
    showToast("Conecta Supabase para cambiar password");
    return;
  }
  const password = document.getElementById("settings-new-password")?.value || "";
  const confirm = document.getElementById("settings-confirm-password")?.value || "";
  if (password.length < 8) {
    showToast("El password debe tener minimo 8 caracteres");
    return;
  }
  if (password !== confirm) {
    showToast("Los passwords no coinciden");
    return;
  }

  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) {
    showToast(error.message || "No se pudo cambiar password");
    return;
  }
  document.getElementById("settings-new-password").value = "";
  document.getElementById("settings-confirm-password").value = "";
  showToast("Password actualizado");
}

function brandSlugFromName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function addBrandToCanonicalCollection(row) {
  const mappedBrand = mapDbBrand(row);
  const existingIndex = brands.findIndex((brand) => brand.id === mappedBrand.id);
  if (existingIndex >= 0) brands.splice(existingIndex, 1, mappedBrand);
  else brands.push(mappedBrand);
  brands.sort((left, right) =>
    String(left.name || "").localeCompare(String(right.name || ""), "es", { sensitivity: "base" }),
  );
  return mappedBrand;
}

function openCreateBrand() {
  if (!canCreateBrands()) {
    showToast("No tienes permiso para crear marcas");
    return;
  }
  state.creatingBrand = true;
  state.brandSubmitting = false;
  render();
}

function closeCreateBrand() {
  if (state.brandSubmitting) return;
  state.creatingBrand = false;
  render();
}

async function saveBrand() {
  if (state.brandSubmitting) return;
  if (!canCreateBrands()) {
    showToast("No tienes permiso para crear marcas");
    return;
  }

  if (isSupabaseMode() && (!dataState.clientsReady || !dataState.brandsReady)) {
    showToast("No se pudo verificar el catálogo de clientes y marcas");
    return;
  }

  const name = String(document.getElementById("new-brand-name")?.value || "").trim();
  const rawAbbreviation = String(document.getElementById("new-brand-code")?.value || "").trim();
  const abbreviation = rawAbbreviation ? normalizeBrandCodePrefix(rawAbbreviation).slice(0, 4) : "";
  const clientId = document.getElementById("new-brand-client")?.value || "";
  const slug = brandSlugFromName(name);

  if (!name) {
    showToast("Escribe el nombre de la marca");
    return;
  }
  if (!clientId || !clients.some((client) => client.id === clientId)) {
    showToast("Selecciona el cliente de la marca");
    return;
  }
  if (abbreviation.length < 2) {
    showToast("Escribe un código de al menos 2 caracteres");
    return;
  }
  const duplicate = brands.find(
    (brand) =>
      normalizeSearchText(brand.name) === normalizeSearchText(name) ||
      String(brand.slug || "").toLowerCase() === slug ||
      normalizeBrandCodePrefix(brand.abbreviation) === abbreviation,
  );
  if (duplicate) {
    showToast(`Ya existe la marca ${duplicate.name}`);
    return;
  }

  state.brandSubmitting = true;
  render();
  try {
    let createdRow;
    if (isSupabaseMode()) {
      const { data, error } = await supabaseClient.rpc("create_brand", {
        target_name: name,
        target_client_id: clientId,
        target_abbreviation: abbreviation,
      });
      if (error) throw error;
      createdRow = Array.isArray(data) ? data[0] : data;
      if (
        !createdRow?.id ||
        createdRow.client_id !== clientId ||
        !createdRow.name ||
        !createdRow.slug ||
        !createdRow.abbreviation ||
        createdRow.is_active !== true
      ) {
        throw new Error("Supabase devolvió una marca incompleta");
      }
    } else {
      createdRow = {
        id: crypto.randomUUID(),
        client_id: clientId,
        name,
        slug,
        abbreviation,
        is_active: true,
      };
    }

    addBrandToCanonicalCollection(createdRow);
    state.creatingBrand = false;
    showToast(`Marca ${createdRow.name} creada`);
    render();

    if (isSupabaseMode()) {
      const refreshResult = await loadActiveBrandRows();
      if (refreshResult.error) {
        debugInteraction("brands:refresh-after-create:error", {
          code: refreshResult.error.code || "",
          message: refreshResult.error.message || "",
        });
      } else {
        setCollection(brands, (refreshResult.data || []).map(mapDbBrand));
      }
    }
  } catch (error) {
    showToast(error.message || "No se pudo crear la marca");
  } finally {
    state.brandSubmitting = false;
    render();
  }
}

async function logout() {
  if (isSupabaseMode()) {
    await supabaseClient.auth.signOut();
    dataState.session = null;
    dataState.profile = null;
    dataState.clientsReady = false;
    dataState.brandsReady = false;
    state.workOrderConversations = {};
    state.workOrderMentionCandidates = {};
    state.workOrderCommentMentionDrafts = {};
    state.mentionInbox = { status: "idle", items: [], error: "" };
    state.mentionInboxOpen = false;
    render();
    return;
  }
  showToast("Sesion demo cerrada");
}

function newAdminUser() {
  state.adminEditingUserId = "__new__";
  render();
}

function getAdminUserFormValues() {
  const id = document.getElementById("admin-user-id")?.value.trim();
  const name = document.getElementById("admin-user-name")?.value.trim();
  const email = document.getElementById("admin-user-email")?.value.trim();
  const role = document.getElementById("admin-user-role")?.value || "creativo";
  const isActive = document.getElementById("admin-user-active")?.value !== "false";
  const brandIds = Array.from(document.querySelectorAll("[data-admin-user-brand]:checked")).map(
    (input) => input.dataset.adminUserBrand,
  );
  return { id, name, email, role, isActive, brandIds };
}

function validateAdminUserForm(values) {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!values.id || !uuidPattern.test(values.id)) return "Pega un UUID valido de Supabase Auth";
  if (!values.name) return "Escribe el nombre completo";
  if (!values.email || !values.email.includes("@")) return "Escribe un email valido";
  if (!roleLabels[values.role]) return "Selecciona un rol valido";
  return "";
}

async function saveAdminUser() {
  if (isSupabaseMode() && !isSystemAdmin()) {
    showToast("Solo Admin o Dirección puede editar usuarios");
    return;
  }

  const values = getAdminUserFormValues();
  const validationError = validateAdminUserForm(values);
  if (validationError) {
    showToast(validationError);
    return;
  }
  if (isSupabaseMode() && values.id === dataState.session?.user?.id && !["admin", "directora"].includes(values.role)) {
    showToast("No puedes quitarte permisos de admin desde aqui");
    return;
  }
  if (isSupabaseMode() && values.id === dataState.session?.user?.id && !values.isActive) {
    showToast("No puedes desactivar tu propio usuario");
    return;
  }

  try {
    if (isSupabaseMode()) {
      const { error: profileError } = await supabaseClient.from("profiles").upsert(
        {
          id: values.id,
          full_name: values.name,
          email: values.email,
          role: values.role,
          is_active: values.isActive,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
      if (profileError) throw profileError;

      const { error: deleteError } = await supabaseClient.from("brand_memberships").delete().eq("user_id", values.id);
      if (deleteError) throw deleteError;

      if (values.brandIds.length) {
        const { error: membershipError } = await supabaseClient.from("brand_memberships").insert(
          values.brandIds.map((brandId) => ({
            user_id: values.id,
            brand_id: brandId,
            role: values.role,
          })),
        );
        if (membershipError) throw membershipError;
      }

      await loadSupabaseData();
    } else {
      const existingIndex = users.findIndex((user) => user.id === values.id);
      const nextUser = {
        id: values.id,
        name: values.name,
        email: values.email,
        role: values.role,
        isActive: values.isActive,
        brands: values.brandIds,
        memberships: values.brandIds.map((brandId) => ({ user_id: values.id, brand_id: brandId, role: values.role })),
      };
      if (existingIndex >= 0) users.splice(existingIndex, 1, nextUser);
      else users.push(nextUser);
      saveUsers();
    }

    state.adminEditingUserId = values.id;
    showToast("Usuario guardado");
    render();
  } catch (error) {
    showToast(error.message || "No se pudo guardar el usuario");
  }
}

async function setAdminUserActive(id, isActive) {
  if (!id) return;
  if (isSupabaseMode() && !isSystemAdmin()) {
    showToast("Solo Admin o Dirección puede editar usuarios");
    return;
  }
  if (isSupabaseMode() && id === dataState.session?.user?.id && !isActive) {
    showToast("No puedes desactivar tu propio usuario");
    return;
  }

  try {
    if (isSupabaseMode()) {
      const { error } = await supabaseClient
        .from("profiles")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await loadSupabaseData();
    } else {
      const user = users.find((item) => item.id === id);
      if (user) user.isActive = isActive;
      saveUsers();
    }
    state.adminEditingUserId = id;
    showToast(isActive ? "Usuario activado" : "Usuario desactivado");
    render();
  } catch (error) {
    showToast(error.message || "No se pudo actualizar el usuario");
  }
}

function updateContentStatus(id, status, message) {
  const item = contentItems.find((contentItem) => contentItem.id === id);
  if (!item) return;
  item.status = status;
  if (status === "approved") item.stage = "scheduled";
  item.comments.push({
    author: "Giuliana",
    visibility: status === "changes_requested" ? "client" : "internal",
    text: message,
  });
  saveContentItems();
  showToast(message);
}

function updateContentStage(id, stage, message) {
  const item = contentItems.find((contentItem) => contentItem.id === id);
  if (!item) return;
  item.stage = stage;
  if (stage === "final" && item.status === "draft") item.status = "internal_review";
  if (stage === "scheduled" && !["approved", "completed"].includes(item.status)) item.status = "client_review";
  item.comments.push({
    author: "Giuliana",
    visibility: "internal",
    text: message,
  });
  state.contentView = stage;
  saveContentItems();
  showToast(message);
}

function addContentComment(id) {
  const item = contentItems.find((contentItem) => contentItem.id === id);
  const input = document.querySelector(`[data-comment-input="${id}"]`);
  const visibility = document.querySelector(`[data-comment-visibility="${id}"]`);
  const text = input?.value.trim();
  if (!item || !text) {
    showToast("Escribe un comentario antes de guardarlo");
    return;
  }
  item.comments.push({
    author: "Giuliana",
    visibility: visibility?.value || "internal",
    text,
  });
  saveContentItems();
  showToast("Comentario guardado");
}

function getWorkOrderFormValues() {
  const title = document.getElementById("ot-title")?.value.trim() || "";
  const assignees = selectedWorkOrderAssigneeIdsFromForm();
  const dueDate = document.getElementById("ot-due-date")?.value || "";
  const priority = document.getElementById("ot-priority")?.value || "medium";
  const status = document.getElementById("ot-status")?.value || "new";
  const category = document.getElementById("ot-category")?.value || "diseno";
  const artCountRaw = document.getElementById("ot-art-count")?.value?.trim() || "";
  const artCount = artCountRaw === "" ? null : Number(artCountRaw);
  const descriptionBase = document.getElementById("ot-description")?.value.trim() || "";
  const subtasks = parseListLines(document.getElementById("ot-subtasks")?.value || "");
  const materialChanges = parseListLines(document.getElementById("ot-material-changes")?.value || "");
  const description = composeWorkOrderDescription(descriptionBase, subtasks, materialChanges);
  const notifyOnEmail = document.getElementById("ot-email")?.checked ?? true;
  const filesInput = document.getElementById("ot-files");
  const fileUploads = filesInput ? Array.from(filesInput.files) : [];
  const files = fileUploads.map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
  }));
  const phaseRows = document.querySelectorAll("[data-phase-row]");
  const phases = phaseRows.length
    ? getWorkOrderPhaseFormValues()
    : normalizeWorkOrderPhases(state.workOrderDraftPhases);
  const usesPhases = phases.length > 0;
  return {
    title,
    assignees,
    dueDate,
    priority,
    status,
    category,
    artCount,
    description,
    subtasks,
    materialChanges,
    notifyOnEmail,
    fileUploads,
    files,
    usesPhases,
    phases,
  };
}

function getWorkOrderPhaseFormValues() {
  const rows = Array.from(document.querySelectorAll("[data-phase-row]"));
  return rows
    .map((row, index) => {
      const fieldValue = (field) => row.querySelector(`[data-phase-field="${field}"]`)?.value?.trim() || "";
      const phaseKey = fieldValue("phaseKey") || "custom";
      const status = fieldValue("status") || "pending";
      return normalizedPhaseFromValues(
        {
          dbId: row.dataset.phaseDbId || null,
          phaseKey,
          title: fieldValue("title") || workOrderPhaseTitle(phaseKey),
          description: fieldValue("description"),
          assignedTo: fieldValue("assignedTo"),
          status,
          dueDate: fieldValue("dueDate"),
          completedAt: status === "completed" ? new Date().toISOString() : null,
          sortOrder: index,
        },
        index,
      );
    })
    .filter((phase) => phase.title);
}

function phaseIntegrityKey(phase, index) {
  return phase?.dbId || phase?.id || `${phase?.phaseKey || "custom"}:${phase?.title || ""}:${index}`;
}

function validateLoadedPhaseIntegrityBeforeSave(order, nextPhases = []) {
  const originalPhases = normalizeWorkOrderPhases(workOrderPhases(order));
  if (!originalPhases.length) return null;
  const normalizedNextPhases = normalizeWorkOrderPhases(nextPhases);
  if (!normalizedNextPhases.length) {
    return {
      reason: "missing_phase_rows",
      message: "No se guardó la OT porque las fases cargadas no están disponibles. Recarga antes de guardar.",
    };
  }
  const nextByKey = new Map(normalizedNextPhases.map((phase, index) => [phaseIntegrityKey(phase, index), phase]));
  for (const [index, originalPhase] of originalPhases.entries()) {
    const key = phaseIntegrityKey(originalPhase, index);
    const nextPhase = nextByKey.get(key);
    if (!nextPhase) {
      return {
        reason: "missing_original_phase",
        phaseId: originalPhase.dbId || originalPhase.id,
        message: `No se guardó la OT porque falta la fase "${originalPhase.title}". Recarga antes de guardar.`,
      };
    }
    if (originalPhase.assignedTo && !nextPhase.assignedTo) {
      return {
        reason: "assigned_to_would_be_cleared",
        phaseId: originalPhase.dbId || originalPhase.id,
        message: `No se guardó la OT porque la fase "${originalPhase.title}" perdería su responsable asignado.`,
      };
    }
    if (originalPhase.dueDate && !nextPhase.dueDate) {
      return {
        reason: "due_date_would_be_cleared",
        phaseId: originalPhase.dbId || originalPhase.id,
        message: `No se guardó la OT porque la fase "${originalPhase.title}" perdería su deadline.`,
      };
    }
  }
  return null;
}

function validateWorkOrderValues(values, existingOrder = null) {
  if (!values.title) {
    showToast("Agrega un título para crear la OT");
    return false;
  }
  if (values.artCount !== null && (!Number.isInteger(values.artCount) || values.artCount < 0)) {
    showToast("La cantidad de artes debe ser un número entero igual o mayor a 0");
    return false;
  }
  const originalDueDate = existingOrder?.dueDate || "";
  if (isPastDateOnly(values.dueDate) && values.dueDate !== originalDueDate) {
    showToast("La fecha de entrega no puede estar en el pasado.");
    return false;
  }
  const originalPhases = workOrderPhases(existingOrder);
  const originalPhasesById = new Map(originalPhases.filter((phase) => phase.dbId).map((phase) => [phase.dbId, phase]));
  for (const phase of values.phases) {
    if (!isPastDateOnly(phase.dueDate)) continue;
    const originalPhase = phase.dbId ? originalPhasesById.get(phase.dbId) : null;
    if (!originalPhase || phase.dueDate !== originalPhase.dueDate) {
      showToast("La fecha de entrega no puede estar en el pasado.");
      return false;
    }
  }
  return true;
}

function fillWorkOrderWithAi(promptOverride = "") {
  if (!ENABLE_AI_ASSISTANT) {
    showToast("Asistente IA desactivado para piloto");
    return;
  }
  if (isAllBrandsScope()) {
    showToast("Selecciona una marca para usar la IA de OTs");
    return;
  }
  const promptInput = document.getElementById("ot-ai-brief");
  const prompt = promptOverride || promptInput?.value.trim() || "";
  const fallbackPrompt = [
    document.getElementById("ot-title")?.value,
    document.getElementById("ot-description")?.value,
    document.getElementById("ot-subtasks")?.value,
    document.getElementById("ot-material-changes")?.value,
  ]
    .filter(Boolean)
    .join("\n");
  const sourcePrompt = prompt || fallbackPrompt;
  if (!sourcePrompt.trim()) {
    showToast("Escribe una solicitud para que la IA complete la orden");
    return;
  }

  const selectedAssignees = new Set(Array.from(document.querySelectorAll("[data-ot-assignee]:checked")).map((input) => input.value));
  const availableUsers = availableWorkOrderAssigneeUsers(selectedAssignees);
  const draft = buildWorkOrderAiDraft(sourcePrompt, availableUsers, getBrand());
  const titleInput = document.getElementById("ot-title");
  const dueDateInput = document.getElementById("ot-due-date");
  const priorityInput = document.getElementById("ot-priority");
  const categoryInput = document.getElementById("ot-category");
  const descriptionInput = document.getElementById("ot-description");
  const subtasksInput = document.getElementById("ot-subtasks");
  const materialChangesInput = document.getElementById("ot-material-changes");

  if (titleInput && !titleInput.value.trim()) titleInput.value = draft.title;
  if (dueDateInput) dueDateInput.value = draft.dueDate;
  if (priorityInput) priorityInput.value = draft.priority;
  if (categoryInput) categoryInput.value = draft.category;
  if (descriptionInput) descriptionInput.value = draft.description;
  if (subtasksInput) subtasksInput.value = draft.subtasks.join("\n");
  if (materialChangesInput) materialChangesInput.value = draft.materialChanges.join("\n");

  if (draft.assignees.length) {
    document.querySelectorAll("[data-ot-assignee]").forEach((input) => {
      input.checked = selectedAssignees.has(input.value) || draft.assignees.includes(input.value);
    });
    refreshAssigneeSelectedList();
  }

  syncWorkOrderFormDraftFromForm();
  refreshWorkOrderGuidancePanels();
  showToast("Borrador armado con IA. Revisa y presiona Crear OT para guardarla.");
}

function optimizeWorkOrderUrgency() {
  if (isAllBrandsScope()) {
    showToast("Selecciona una marca para calcular la sugerencia de planificación");
    return;
  }
  const category = document.getElementById("ot-category")?.value || "diseno";
  const plan = urgentWorkOrderPlan({ category, priority: "high" });
  const dueDateInput = document.getElementById("ot-due-date");
  const priorityInput = document.getElementById("ot-priority");
  const subtasksInput = document.getElementById("ot-subtasks");
  const existingTasks = parseListLines(subtasksInput?.value || "");
  const urgentTask = "Confirmar fecha ideal segun tareas del equipo";

  if (dueDateInput) dueDateInput.value = plan.dueDate;
  if (priorityInput) priorityInput.value = "high";
  if (subtasksInput && !existingTasks.includes(urgentTask)) {
    subtasksInput.value = [urgentTask, ...existingTasks].join("\n");
  }
  if (plan.candidate) {
    document.querySelectorAll("[data-ot-assignee]").forEach((input) => {
      if (input.value === plan.candidate.id) input.checked = true;
    });
    refreshAssigneeSelectedList();
  }
  syncWorkOrderFormDraftFromForm();
  refreshWorkOrderGuidancePanels();
  showToast(plan.candidate ? `Sugerencia aplicada: ${plan.candidate.name} / ${formatDate(plan.dueDate)}` : "Fecha sugerida; falta responsable disponible");
}

async function uploadWorkOrderFiles(orderDbId, brandId, fileUploads) {
  let uploadedCount = 0;
  for (const file of fileUploads) {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const storagePath = `${brandId}/${orderDbId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabaseClient.storage.from("work-order-files").upload(storagePath, file);
    if (uploadError) {
      showToast(`No se pudo subir ${file.name}: ${uploadError.message}`);
      continue;
    }
    const { error: fileError } = await supabaseClient.from("work_order_files").insert({
      work_order_id: orderDbId,
      storage_path: storagePath,
      file_name: file.name,
      file_type: file.type || "application/octet-stream",
      file_size: file.size,
      uploaded_by: dataState.session?.user?.id,
    });
    if (fileError) {
      showToast(`Archivo subido, pero no se pudo registrar: ${fileError.message}`);
      continue;
    }
    uploadedCount += 1;
  }
  return uploadedCount;
}

async function replaceSupabaseWorkOrderPhases(orderDbId, phases = []) {
  if (!orderDbId) return { error: null };
  const normalized = normalizeWorkOrderPhases(phases);
  const phasesPayload = normalized.map((phase, index) => ({
    id: phase.dbId || null,
    phase_key: phase.phaseKey,
    title: phase.title,
    description: phase.description || null,
    assigned_to: phase.assignedTo || null,
    status: phase.status,
    due_date: phase.dueDate || null,
    completed_at: phase.status === "completed" ? phase.completedAt || null : null,
    sort_order: index,
  }));
  const { error } = await supabaseClient.rpc("save_work_order_phases", {
    target_work_order_id: orderDbId,
    phases_payload: phasesPayload,
  });
  return { error };
}

async function reorderSupabaseWorkOrderPhases(orderDbId, phases = []) {
  if (!orderDbId) return { data: null, error: new Error("missing_work_order_id") };
  const phasesPayload = phases.map((phase) => ({
    id: phase.dbId || phase.id,
    updated_at: phase.updatedAt || null,
  }));
  if (phasesPayload.some((phase) => !phase.id || !phase.updated_at)) {
    return { data: null, error: new Error("invalid_phase_reorder_payload") };
  }
  return supabaseClient.rpc("reorder_work_order_phases", {
    target_work_order_id: orderDbId,
    phases_payload: phasesPayload,
  });
}

async function reorderWorkOrderPhases(orderId, orderedPhaseIds = []) {
  const order = findWorkOrderByAnyId(orderId);
  if (!order || !canReorderWorkOrderPhases(order)) return false;

  const previousPhases = order.phases.map((phase) => ({ ...phase }));
  try {
    const candidatePhases = phaseReorder.applyPhaseOrder(previousPhases, orderedPhaseIds);
    if (phaseReorder.hasSamePhaseOrder(previousPhases, candidatePhases)) return false;
  } catch (error) {
    console.warn("[Lumen phases] invalid reorder", error);
    showToast("No se pudo actualizar el orden de las fases.");
    return false;
  }

  state.workOrderPhaseReorderSavingId = order.id;

  try {
    const result = await phaseReorder.commitPhaseOrder({
      phases: previousPhases,
      orderedPhaseIds,
      onChange: (phases) => {
        order.phases = phases;
        render();
      },
      persist: async (nextPhases) => {
        if (!isSupabaseMode()) {
          saveWorkOrders();
          return nextPhases;
        }
        const { data, error } = await reorderSupabaseWorkOrderPhases(order.dbId, nextPhases);
        if (error) throw error;
        const rowsById = new Map((data || []).map((row) => [String(row.id), row]));
        return nextPhases.map((phase, index) => {
          const row = rowsById.get(phaseReorder.phaseIdentity(phase));
          return {
            ...phase,
            sortOrder: Number(row?.sort_order ?? index),
            updatedAt: row?.updated_at || phase.updatedAt,
          };
        });
      },
    });
    order.phases = result.phases;
    state.workOrderPhaseReorderSavingId = "";
    showToast("Orden de fases actualizado");
    return true;
  } catch (error) {
    console.warn("[Lumen phases] reorder failed", error);
    state.workOrderPhaseReorderSavingId = "";
    showToast("No se pudo actualizar el orden de las fases.");
    return false;
  }
}

async function queueWorkOrderAssignmentNotifications(orderId, code) {
  const { data, error } = await supabaseClient.rpc("queue_work_order_assignment_notifications", {
    target_work_order_id: orderId,
  });
  debugInteraction("work-order-created:assignment-rpc", {
    orderId,
    code,
    result: data || null,
    error: error
      ? {
          code: error.code || null,
          message: error.message || "unknown_error",
        }
      : null,
  });
  return { data, error };
}

function workOrderRecipientUsers(order, assigneeIds = orderAssignees(order)) {
  return brandEmailRecipientUsers(order.brandId, workOrderRelatedUserIds(order.brandId, assigneeIds, workOrderPhases(order)));
}

function phaseAssigneeIds(phases = []) {
  return Array.from(new Set(phases.map((phase) => phase.assignedTo).filter(Boolean)));
}

function workOrderRelatedUserIds(orderOrBrandId, assigneeIds = [], phases = []) {
  const related = new Set([...(assigneeIds || []), ...phaseAssigneeIds(phases || [])]);
  return Array.from(related).filter(Boolean);
}

function describeListChanges(label, previousItems = [], nextItems = [], gender = "f") {
  const previousSet = new Set(previousItems.map(plainText));
  const nextSet = new Set(nextItems.map(plainText));
  const added = nextItems.filter((item) => !previousSet.has(plainText(item)));
  const removed = previousItems.filter((item) => !nextSet.has(plainText(item)));
  const addedWord = gender === "m" ? "agregado" : "agregada";
  const removedWord = gender === "m" ? "eliminado" : "eliminada";
  return [
    ...added.map((item) => `${label} ${addedWord}: ${item}`),
    ...removed.map((item) => `${label} ${removedWord}: ${item}`),
  ];
}

function describeWorkOrderChanges(order, values = {}, uploadedCount = 0) {
  const changes = [];
  if (values.title && values.title !== order.title) changes.push(`Titulo: ${order.title} -> ${values.title}`);
  if (values.status && values.status !== order.status) {
    changes.push(`Estado: ${workOrderStatusLabels[order.status] || order.status} -> ${workOrderStatusLabels[values.status] || values.status}`);
  }
  if (values.priority && values.priority !== order.priority) {
    changes.push(`Prioridad: ${workOrderPriorityLabels[order.priority] || order.priority} -> ${workOrderPriorityLabels[values.priority] || values.priority}`);
  }
  if (values.dueDate && values.dueDate !== order.dueDate) changes.push(`Deadline: ${formatDate(order.dueDate)} -> ${formatDate(values.dueDate)}`);
  if (Object.prototype.hasOwnProperty.call(values, "artCount") && values.artCount !== (order.artCount ?? null)) {
    changes.push(`Cantidad de artes: ${order.artCount ?? "sin especificar"} -> ${values.artCount ?? "sin especificar"}`);
  }
  if (Array.isArray(values.assignees)) {
    const previousAssignees = orderAssignees(order);
    const addedAssignees = values.assignees.filter((userId) => !previousAssignees.includes(userId));
    const removedAssignees = previousAssignees.filter((userId) => !values.assignees.includes(userId));
    if (addedAssignees.length) changes.push(`Responsables agregados: ${addedAssignees.map(userName).join(", ")}`);
    if (removedAssignees.length) changes.push(`Responsables removidos: ${removedAssignees.map(userName).join(", ")}`);
  }
  if (Object.prototype.hasOwnProperty.call(values, "description") && values.description !== (order.description || "")) {
    const previousDescription = splitWorkOrderDescription(order.description || "");
    const nextDescription = splitWorkOrderDescription(values.description);
    const descriptionChanges = [
      ...describeListChanges("Subtarea", previousDescription.subtasks, nextDescription.subtasks),
      ...describeListChanges("Cambio de material", previousDescription.materialChanges, nextDescription.materialChanges, "m"),
    ];
    if (plainText(previousDescription.description) !== plainText(nextDescription.description)) {
      changes.push("Brief o descripcion principal actualizada");
    }
    changes.push(...descriptionChanges);
    if (!descriptionChanges.length && plainText(previousDescription.description) === plainText(nextDescription.description)) {
      changes.push("Descripcion, subtareas o cambios de materiales actualizados");
    }
  }
  if (Array.isArray(values.phases)) {
    const previousPhases = workOrderPhases(order);
    const previousSummary = previousPhases.map((phase) => `${phase.title}:${phase.status}:${phase.assignedTo}:${phase.dueDate}`).join("|");
    const nextSummary = values.phases.map((phase) => `${phase.title}:${phase.status}:${phase.assignedTo}:${phase.dueDate}`).join("|");
    if (previousSummary !== nextSummary) {
      changes.push(`Fases internas actualizadas (${values.phases.length})`);
    }
  }
  if (uploadedCount) changes.push(`${uploadedCount} material${uploadedCount === 1 ? "" : "es"} agregado${uploadedCount === 1 ? "" : "s"}`);
  return changes;
}

function buildWorkOrderUpdateEmail(order, changes, uploadedCount = 0) {
  const brand = getBrand(order.brandId);
  const client = getClient(brand.clientId);
  const workOrderUrl = buildWorkOrderUrl(order.id, order.brandId);
  const parsedDescription = splitWorkOrderDescription(order.description || "");
  return `
    <div style="margin:0;background:#f6f6f3;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #deded8;border-radius:14px;overflow:hidden;">
        <div style="padding:26px 28px 20px;border-left:7px solid #49ee8c;">
          <div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#176339;margin-bottom:10px;">
            Actualizacion de orden
          </div>
          <h1 style="margin:0 0 8px;font-size:28px;line-height:1.15;color:#2d2d2d;">${escapeHtml(order.id)}</h1>
          <p style="margin:0;color:#5f6760;font-size:17px;line-height:1.45;">${escapeHtml(order.title)}</p>
        </div>
        <div style="padding:0 28px 26px;">
          <table role="presentation" style="width:100%;border-collapse:collapse;margin:10px 0 22px;">
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Cliente / marca</td>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">${escapeHtml(client?.name || "Cliente")} / ${escapeHtml(brand.name)}</td>
            </tr>
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Estado actual</td>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">${escapeHtml(workOrderStatusLabels[order.status] || order.status)}</td>
            </tr>
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Deadline</td>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">${escapeHtml(formatDate(order.dueDate))}</td>
            </tr>
          </table>

          <div style="margin-bottom:20px;border:1px solid #ecece8;border-radius:12px;padding:14px 16px;background:#fafaf8;">
            <div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#6b726c;margin-bottom:8px;">Que cambio</div>
            <ul style="margin:0;padding-left:18px;font-size:15px;line-height:1.55;color:#3c403d;">
              ${changes.map((change) => `<li>${escapeHtml(change)}</li>`).join("")}
            </ul>
          </div>

          ${
            parsedDescription.materialChanges.length
              ? `<div style="margin-bottom:12px;font-size:15px;line-height:1.55;"><strong>Cambios de materiales:</strong> ${escapeHtml(parsedDescription.materialChanges.join(" / "))}</div>`
              : ""
          }

          ${
            parsedDescription.subtasks.length
              ? `<div style="margin-bottom:20px;font-size:15px;line-height:1.55;"><strong>Subtareas actuales:</strong> ${escapeHtml(parsedDescription.subtasks.join(" / "))}</div>`
              : ""
          }

          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px;">
            <span style="display:inline-block;background:#e9fff1;color:#176339;border-radius:999px;padding:8px 12px;font-weight:700;">${uploadedCount ? `${uploadedCount} material(es) nuevo(s)` : "Sin nuevos archivos"}</span>
            <span style="display:inline-block;background:#f0f1ee;color:#555b56;border-radius:999px;padding:8px 12px;">Responsables: ${escapeHtml(orderAssignees(order).map(userName).join(", ") || "Sin asignar")}</span>
          </div>

          <a href="${escapeHtml(workOrderUrl)}" style="display:inline-block;background:#2d2d2d;color:#ffffff;text-decoration:none;border-radius:10px;padding:14px 18px;font-size:16px;font-weight:800;">
            Ver orden actualizada
          </a>
        </div>
      </div>
    </div>
  `;
}

async function queueWorkOrderUpdateEmails(order, changes, uploadedCount = 0, assigneeIds = orderAssignees(order)) {
  if (!isSupabaseMode() || !order.dbId || !changes.length || order.notifyOnEmail === false) return 0;
  const recipients = workOrderRecipientUsers(order, assigneeIds);
  // Los cambios rutinarios ya están en work_order_activity y se agrupan al final del día.
  return recipients.length;
}

function urgentAlertRecipients(order) {
  const relatedUserIds = uniqueUserIds([order.createdBy, ...workOrderRelatedUserIds(order.brandId, orderAssignees(order), workOrderPhases(order))]);
  return brandEmailRecipientUsers(order.brandId, relatedUserIds, { includeConfigured: true });
}

function buildUrgentWorkOrderEmail(order) {
  const brand = getBrand(order.brandId);
  const client = getClient(brand.clientId);
  const urgency = workOrderUrgency(order);
  const workOrderUrl = buildWorkOrderUrl(order.id, order.brandId);
  const parsedDescription = splitWorkOrderDescription(order.description || "");

  return `
    <div style="margin:0;background:#f6f6f3;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #deded8;border-radius:14px;overflow:hidden;">
        <div style="padding:26px 28px 20px;border-left:7px solid #c84e48;">
          <div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#9f1c1c;margin-bottom:10px;">
            Alerta urgente de OT
          </div>
          <h1 style="margin:0 0 8px;font-size:28px;line-height:1.15;color:#2d2d2d;">${escapeHtml(order.id)}</h1>
          <p style="margin:0;color:#5f6760;font-size:17px;line-height:1.45;">${escapeHtml(order.title)}</p>
        </div>
        <div style="padding:0 28px 26px;">
          <table role="presentation" style="width:100%;border-collapse:collapse;margin:10px 0 22px;">
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Cliente / marca</td>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">${escapeHtml(client?.name || "Cliente")} / ${escapeHtml(brand.name)}</td>
            </tr>
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Deadline</td>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">${escapeHtml(formatDate(order.dueDate))}</td>
            </tr>
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Estado</td>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">${escapeHtml(workOrderStatusLabels[order.status] || order.status)}</td>
            </tr>
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Urgencia</td>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;color:#9f1c1c;">${escapeHtml(urgency.label)}</td>
            </tr>
          </table>
          <div style="margin-bottom:22px;">
            <div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#6b726c;margin-bottom:6px;">Responsables</div>
            <div style="font-size:16px;line-height:1.45;">${escapeHtml(orderAssignees(order).map(userName).join(", ") || "Sin responsables")}</div>
          </div>
          <div style="margin-bottom:22px;">
            <div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#6b726c;margin-bottom:6px;">Contexto</div>
            <div style="font-size:16px;line-height:1.55;color:#3c403d;">${escapeHtml(plainText(parsedDescription.description || "Sin descripcion agregada."))}</div>
          </div>
          <a href="${escapeHtml(workOrderUrl)}" style="display:inline-block;background:#2d2d2d;color:#ffffff;text-decoration:none;border-radius:10px;padding:14px 18px;font-size:16px;font-weight:800;">
            Ver orden urgente
          </a>
        </div>
      </div>
    </div>
  `;
}

async function createWorkOrderFromForm() {
  if (state.workOrderSubmitting) {
    debugInteraction("create-work-order-blocked", { reason: "already-submitting" });
    return;
  }
  if (!canCreateWorkOrders()) {
    showToast("Solo Dirección, Cuentas, Generador o Creativo puede crear órdenes");
    return;
  }
  if (isAllBrandsScope()) {
    showToast("Selecciona una marca antes de crear una OT");
    return;
  }
  syncWorkOrderFormDraftFromForm();
  const values = getWorkOrderFormValues();
  if (!validateWorkOrderValues(values)) return;
  setWorkOrderCreateSubmitting(true);
  try {
  let code = "";
  try {
    code = await generateWorkOrderCodeForBrand(state.currentBrandId);
  } catch (error) {
    showToast(`No se pudo generar el código de la OT: ${error.message || "ejecuta supabase/patch_work_order_brand_codes.sql"}`);
    return;
  }

  if (isSupabaseMode()) {
    const orderPayload = {
      code,
      brand_id: state.currentBrandId,
      title: values.title,
      status: values.status,
      priority: values.priority,
      category: values.category,
      due_date: values.dueDate || null,
      description: values.description,
      created_by: dataState.session?.user?.id,
      notify_on_email: values.notifyOnEmail,
    };
    if (values.artCount !== null) orderPayload.art_count = values.artCount;

    const { data: insertedOrder, error: orderError } = await supabaseClient
      .from("work_orders")
      .insert(orderPayload)
      .select()
      .single();

    if (orderError) {
      const message = orderError.message || "";
      if (message.includes("work_order_status") || message.includes("client_approved") || message.includes("scheduled")) {
        showToast("Supabase no aceptó ese estado. Usa Nueva, En proceso, En revisión, Entregada o Cancelada.");
      } else if (message.includes("art_count")) {
        showToast("Falta activar cantidad de artes en Supabase: ejecuta supabase/patch_work_order_art_count.sql");
      } else {
        showToast(`No se pudo crear la OT: ${message}`);
      }
      return;
    }

    let assigneesError = null;
    if (values.assignees.length) {
      const { error: assigneeError } = await supabaseClient.from("work_order_assignees").insert(
        values.assignees.map((userId) => ({
          work_order_id: insertedOrder.id,
          user_id: userId,
          assigned_by: dataState.session?.user?.id,
        })),
      );
      assigneesError = assigneeError;
      if (assigneeError) {
        showToast(`OT creada, pero fallo responsables: ${assigneeError.message}`);
      }
    }

    const uploadedCount = await uploadWorkOrderFiles(insertedOrder.id, state.currentBrandId, values.fileUploads);
    let phasesError = null;
    if (values.phases.length) {
      const result = await replaceSupabaseWorkOrderPhases(insertedOrder.id, values.phases);
      phasesError = result.error;
    }
    if (phasesError) {
      showToast(`OT creada, pero no se guardaron las fases: ${phasesError.message || "error de Supabase"}`);
    }

    await supabaseClient.from("work_order_activity").insert({
      work_order_id: insertedOrder.id,
      actor_id: dataState.session?.user?.id,
      action: "created",
      details: { title: values.title, assignees: values.assignees.length, files: uploadedCount, phases: values.phases.length },
    });

    let assignmentNotificationWarning = "";
    if (!assigneesError && !phasesError) {
      const { error: assignmentNotificationError } = await queueWorkOrderAssignmentNotifications(
        insertedOrder.id,
        code,
      );
      if (assignmentNotificationError) {
        assignmentNotificationWarning =
          `OT ${code} creada, pero no se pudieron preparar los correos de asignación. La orden y sus responsables quedaron guardados.`;
      }
    } else {
      debugInteraction("work-order-created:assignment-rpc-skipped", {
        orderId: insertedOrder.id,
        code,
        result: null,
        error: {
          code: "related_data_not_saved",
          message: assigneesError?.message || phasesError?.message || "unknown_related_data_error",
        },
      });
    }

    await loadSupabaseData();
    state.creatingWorkOrder = false;
    state.workOrderSubmitting = false;
    state.workOrderDraftPhases = [];
    resetWorkOrderFormDraft();
    showToast(assignmentNotificationWarning || `OT creada en Supabase: ${code}`);
    render();
    return;
  }

  workOrders.push({
    id: code,
    brandId: state.currentBrandId,
    title: values.title,
    status: values.status,
    priority: values.priority,
    category: values.category,
    dueDate: values.dueDate || "",
    assignee: values.assignees[0],
    assignees: values.assignees,
    description: values.description,
    files: values.files,
    createdBy: "giu",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    artCount: values.artCount,
    notifyOnEmail: values.notifyOnEmail,
    phases: values.phases,
    linkedContentId: state.selectedContentId,
  });
  saveWorkOrders();
  state.creatingWorkOrder = false;
  state.workOrderSubmitting = false;
  state.workOrderDraftPhases = [];
  resetWorkOrderFormDraft();
  showToast(`OT creada y ${values.notifyOnEmail ? "email preparado" : "sin email"}`);
  render();
  } finally {
    if (state.workOrderSubmitting) setWorkOrderCreateSubmitting(false);
  }
}

async function sendUrgentWorkOrderAlert(id) {
  if (!canManageWorkOrders()) {
    showToast("Solo Dirección o Cuentas puede enviar alertas urgentes");
    return;
  }
  const order = workOrders.find((candidate) => candidate.id === id);
  if (!order) return;
  const recipients = urgentAlertRecipients(order);
  if (!recipients.length) {
    showToast("No hay responsables o destinatarios configurados para esta alerta");
    return;
  }

  const confirmed = window.confirm(
    `Esto enviará una alerta urgente de ${order.id} a ${recipients.length} persona(s) relacionada(s) o configurada(s) para la marca. ¿Enviar ahora?`,
  );
  if (!confirmed) return;

  if (isSupabaseMode()) {
    const { error } = await supabaseClient.from("email_notifications").insert(
      recipients.map((user) => ({
        brand_id: order.brandId,
        work_order_id: order.dbId || null,
        recipient_user_id: user.id,
        recipient_email: user.email,
        notification_type: "overdue",
        subject: `Alerta urgente: ${order.id} - ${order.title}`,
        html_body: buildUrgentWorkOrderEmail(order),
        status: "queued",
        scheduled_for: new Date().toISOString(),
      })),
    );
    if (error) {
      showToast(`No se pudo preparar la alerta: ${error.message}`);
      return;
    }

    await invokeEmailFunction(
      "email-worker",
      (data) => `Alerta urgente enviada o procesada: ${data?.processed ?? 0}`,
    );
    return;
  }

  showToast(`Alerta urgente lista para ${recipients.length} persona(s)`);
}

async function toggleWorkOrderUrgency(id) {
  const order = findWorkOrderByAnyId(id);
  const currentUrgentValue = Boolean(order?.isUrgent ?? order?.is_urgent);
  const nextUrgentValue = !currentUrgentValue;
  debugInteraction("toggle-urgency-start", { id, currentUrgentValue, nextUrgentValue });
  if (!canManageUrgency()) {
    debugInteraction("toggle-urgency-blocked", { reason: "not-management", id, currentUrgentValue, nextUrgentValue });
    showToast("Solo gestión puede marcar urgencias");
    return;
  }
  if (!order) {
    debugInteraction("toggle-urgency-blocked", { reason: "order-not-found", id });
    showToast("No encontre esa OT");
    return;
  }
  if (isArchivedWorkOrder(order)) {
    debugInteraction("toggle-urgency-blocked", { reason: "archived", id: order.id, nextUrgentValue });
    showToast("No se puede cambiar urgencia en una OT archivada");
    return;
  }

  if (isSupabaseMode()) {
    if (!order.dbId) {
      showToast("Esta OT no tiene ID de Supabase");
      return;
    }
    const { data, error } = await supabaseClient
      .from("work_orders")
      .update({ is_urgent: nextUrgentValue, updated_at: new Date().toISOString() })
      .eq("id", order.dbId)
      .select("id,is_urgent,updated_at")
      .single();
    if (error) {
      debugInteraction("toggle-urgency-error", { id: order.id, dbId: order.dbId, nextUrgentValue, message: error.message || "" });
      const message = error.message || "";
      if (message.includes("is_urgent") || message.includes("schema cache")) {
        showToast("Falta activar urgencias en Supabase: ejecuta supabase/patch_work_order_urgency.sql");
      } else {
        showToast(`No se pudo actualizar urgencia: ${message}`);
      }
      return;
    }
    order.isUrgent = Boolean(data?.is_urgent ?? nextUrgentValue);
    order.updatedAt = data?.updated_at || new Date().toISOString();
    const { error: activityError } = await supabaseClient.from("work_order_activity").insert({
      work_order_id: order.dbId,
      actor_id: dataState.session?.user?.id,
      action: order.isUrgent ? "marked_urgent" : "unmarked_urgent",
      details: { is_urgent: order.isUrgent },
    });
    if (activityError) {
      console.warn("[Lumen urgency] activity insert failed", activityError);
    }
    try {
      await loadSupabaseData();
    } catch (loadError) {
      console.warn("[Lumen urgency] refresh after urgency update failed", loadError);
    }
  } else {
    order.isUrgent = nextUrgentValue;
    order.updatedAt = new Date().toISOString();
    saveWorkOrders();
  }

  state.viewingWorkOrderId = order.id;
  state.focusedWorkOrderId = order.id;
  debugInteraction("toggle-urgency-success", { id: order.id, dbId: order.dbId || "", isUrgent: order.isUrgent });
  showToast(order.isUrgent ? "OT marcada como urgencia" : "Urgencia quitada");
  render();
}

function viewWorkOrder(id) {
  const order = findWorkOrderByAnyId(id);
  debugInteraction("view-work-order", {
    receivedId: id,
    found: Boolean(order),
    foundId: order?.id || "",
    foundDbId: order?.dbId || "",
    canOpen: order ? canOpenWorkOrder(order) : false,
    isRelated: order ? isCurrentUserRelatedToWorkOrder(order) : false,
  });
  if (!order) {
    showToast("No encontre esa OT");
    return;
  }
  if (!canOpenWorkOrder(order)) {
    showToast("No tienes acceso a esta orden.");
    return;
  }
  setActiveWorkOrderNavigation(order, { historyMode: "push" });
  state.creatingWorkOrder = false;
  markWorkOrderMentionCandidatesStale(order);
  render();
}

function closeWorkOrderDetail() {
  setActiveWorkOrderNavigation(null, { historyMode: "push" });
  showToast("Detalle cerrado");
  render();
}

function editWorkOrder(id) {
  if (!canManageWorkOrders()) {
    showToast("Solo Dirección o Cuentas puede editar órdenes");
    return;
  }
  const order = workOrders.find((candidate) => candidate.id === id);
  if (!order) return;
  setActiveWorkOrderNavigation(order, { historyMode: "push" });
  state.editingWorkOrderId = id;
  state.workOrderDraftPhases = workOrderPhases(order);
  state.workOrderUsesPhases = state.workOrderDraftPhases.length > 0;
  state.workOrderPhasesExpanded = true;
  state.workOrderFormDraft = null;
  showToast(`Editando ${id}`);
  render();
}

function cancelEditWorkOrder() {
  state.editingWorkOrderId = "";
  state.workOrderDraftPhases = [];
  resetWorkOrderFormDraft();
  showToast("Edicion cancelada");
  render();
}

async function updateWorkOrderFromForm() {
  if (!canManageWorkOrders()) {
    showToast("Solo Dirección o Cuentas puede modificar órdenes");
    return;
  }
  const order = selectedEditingOrder();
  if (!order) {
    showToast("Selecciona una OT para editar");
    return;
  }
  if (isSupabaseMode() && order.dbId && !dataState.workOrderPhasesReady) {
    debugInteraction("work-order-edit:blocked-phases-not-ready", {
      orderId: order.dbId,
      code: order.id,
    });
    showToast("No se pudieron cargar las fases de esta OT. Recarga antes de guardar cambios.");
    return;
  }
  const values = getWorkOrderFormValues();
  if (!validateWorkOrderValues(values, order)) return;

  if (isSupabaseMode()) {
    if (!order.dbId) {
      showToast("Esta OT no tiene ID de Supabase");
      return;
    }
    const phaseIntegrityError = validateLoadedPhaseIntegrityBeforeSave(order, values.phases);
    if (phaseIntegrityError) {
      debugInteraction("work-order-edit:blocked-phase-integrity", {
        orderId: order.dbId,
        code: order.id,
        reason: phaseIntegrityError.reason,
        phaseId: phaseIntegrityError.phaseId || "",
      });
      showToast(phaseIntegrityError.message || "No se guardó la OT porque las fases no están completas.");
      return;
    }

    const updatePayload = {
      title: values.title,
      status: values.status,
      priority: values.priority,
      category: values.category,
      due_date: values.dueDate || null,
      description: values.description,
      notify_on_email: values.notifyOnEmail,
      updated_at: new Date().toISOString(),
    };
    if (values.artCount !== null || (order.artCount !== null && order.artCount !== undefined)) {
      updatePayload.art_count = values.artCount;
    }

    const { error: orderError } = await supabaseClient.from("work_orders").update(updatePayload).eq("id", order.dbId);
    if (orderError) {
      const message = orderError.message || "";
      if (message.includes("work_order_status") || message.includes("client_approved") || message.includes("scheduled")) {
        showToast("Supabase no aceptó ese estado. Usa Nueva, En proceso, En revisión, Entregada o Cancelada.");
      } else if (message.includes("art_count")) {
        showToast("Falta activar cantidad de artes en Supabase: ejecuta supabase/patch_work_order_art_count.sql");
      } else {
        showToast(`No se pudo actualizar la OT: ${message}`);
      }
      return;
    }

    const existingAssignees = orderAssignees(order);
    const removedAssignees = existingAssignees.filter((userId) => !values.assignees.includes(userId));
    const addedAssignees = values.assignees.filter((userId) => !existingAssignees.includes(userId));

    if (removedAssignees.length) {
      const { error: removeError } = await supabaseClient
        .from("work_order_assignees")
        .delete()
        .eq("work_order_id", order.dbId)
        .in("user_id", removedAssignees);
      if (removeError) {
        showToast(`OT actualizada, pero fallo responsables: ${removeError.message}`);
        return;
      }
    }

    if (addedAssignees.length) {
      const { error: addError } = await supabaseClient.from("work_order_assignees").insert(
        addedAssignees.map((userId) => ({
          work_order_id: order.dbId,
          user_id: userId,
          assigned_by: dataState.session?.user?.id,
        })),
      );
      if (addError) {
        showToast(`OT actualizada, pero fallo responsables: ${addError.message}`);
        return;
      }
    }

    const uploadedCount = await uploadWorkOrderFiles(order.dbId, order.brandId, values.fileUploads);
    const { error: phasesError } = await replaceSupabaseWorkOrderPhases(order.dbId, values.phases);
    if (phasesError) {
      showToast(`No se guardaron las fases: ${phasesError.message || "error de Supabase"}`);
      render();
      return;
    }
    const changes = describeWorkOrderChanges(order, values, uploadedCount);
    const updatedOrderForEmail = {
      ...order,
      title: values.title,
      status: values.status,
      priority: values.priority,
      category: values.category,
      dueDate: values.dueDate || order.dueDate,
      description: values.description,
      assignees: values.assignees,
      artCount: values.artCount,
      notifyOnEmail: values.notifyOnEmail,
      phases: values.phases,
    };
    await supabaseClient.from("work_order_activity").insert({
      work_order_id: order.dbId,
      actor_id: dataState.session?.user?.id,
      action: "updated",
      details: {
        title: values.title,
        status_from: order.status,
        status_to: values.status,
        assignees: values.assignees.length,
        files_added: uploadedCount,
        phases: values.phases.length,
        changes,
      },
    });
    await queueWorkOrderUpdateEmails(updatedOrderForEmail, changes, uploadedCount, values.assignees);

    await loadSupabaseData();
    state.editingWorkOrderId = "";
    state.workOrderDraftPhases = [];
    resetWorkOrderFormDraft();
    showToast(`${order.id} actualizada`);
    render();
    return;
  }

  order.title = values.title;
  order.status = values.status;
  order.priority = values.priority;
  order.category = values.category;
  order.dueDate = values.dueDate || order.dueDate;
  order.assignee = values.assignees[0];
  order.assignees = values.assignees;
  order.description = values.description;
  order.files = [...orderFiles(order), ...values.files];
  order.artCount = values.artCount;
  order.notifyOnEmail = values.notifyOnEmail;
  order.phases = values.phases;
  order.updatedAt = new Date().toISOString();
  if (order.linkedContentId && order.status === "completed") {
    const linked = contentItems.find((item) => item.id === order.linkedContentId);
    if (linked && linked.status !== "approved") linked.status = "internal_review";
    saveContentItems();
  }
  saveWorkOrders();
  state.editingWorkOrderId = "";
  state.workOrderDraftPhases = [];
  resetWorkOrderFormDraft();
  showToast(`${order.id} actualizada`);
  render();
}

async function uploadOrderMaterials(id) {
  const order = workOrders.find((candidate) => candidate.id === id);
  if (!order) return;
  if (!canUploadWorkOrderMaterials(order)) {
    showToast("No tienes permiso para subir materiales a esta OT");
    return;
  }
  const filesInput = document.querySelector(`[data-material-files="${id}"]`);
  const fileUploads = filesInput ? Array.from(filesInput.files || []) : [];
  if (!fileUploads.length) {
    showToast("Selecciona uno o varios archivos para subir");
    return;
  }

  if (isSupabaseMode()) {
    if (!order.dbId) {
      showToast("Esta OT no tiene ID de Supabase");
      return;
    }
    const uploadedCount = await uploadWorkOrderFiles(order.dbId, order.brandId, fileUploads);
    if (!uploadedCount) return;
    await supabaseClient.from("work_order_activity").insert({
      work_order_id: order.dbId,
      actor_id: dataState.session?.user?.id,
      action: "materials_uploaded",
      details: { files_added: uploadedCount },
    });
    await queueWorkOrderUpdateEmails(order, describeWorkOrderChanges(order, {}, uploadedCount), uploadedCount);
    await loadSupabaseData();
    showToast(`${uploadedCount} material${uploadedCount === 1 ? "" : "es"} agregado${uploadedCount === 1 ? "" : "s"} a ${order.id}`);
    render();
    return;
  }

  order.files = [
    ...orderFiles(order),
    ...fileUploads.map((file) => ({ name: file.name, size: file.size, type: file.type || "application/octet-stream" })),
  ];
  order.updatedAt = new Date().toISOString();
  saveWorkOrders();
  showToast(`Materiales agregados a ${order.id}`);
  render();
}

function findWorkOrderFile(fileKey) {
  for (const order of workOrders) {
    const files = orderFiles(order);
    const index = files.findIndex((file, fileIndex) => workOrderFileKey(order, file, fileIndex) === fileKey);
    if (index >= 0) return { order, file: files[index], index };
  }
  return null;
}

async function openWorkOrderFile(fileKey) {
  const match = findWorkOrderFile(fileKey);
  if (!match) {
    showToast("No encontre ese archivo en la OT");
    return;
  }
  const { file } = match;

  if (file.url) {
    window.open(file.url, "_blank", "noopener");
    return;
  }

  if (isSupabaseMode() && file.storagePath) {
    const { data, error } = await supabaseClient.storage.from("work-order-files").createSignedUrl(file.storagePath, 3600);
    if (error || !data?.signedUrl) {
      showToast(`No se pudo abrir el archivo: ${error?.message || "sin URL disponible"}`);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
    return;
  }

  showToast(`Archivo registrado: ${file.name}. Los archivos demo no tienen preview descargable.`);
}

async function deleteWorkOrderFile(fileKey) {
  const match = findWorkOrderFile(fileKey);
  if (!match) {
    showToast("No encontre ese archivo en la OT");
    return;
  }
  const { order, file, index } = match;
  if (!canDeleteWorkOrderFile(order, file)) {
    showToast("Solo Cuentas/Dirección o quien subió el archivo puede eliminarlo");
    return;
  }

  const confirmed = window.confirm(`¿Eliminar "${file.name}" de ${order.id}? Esta accion no se puede deshacer.`);
  if (!confirmed) return;

  if (isSupabaseMode()) {
    if (!file.id) {
      showToast("Este archivo no tiene registro de Supabase");
      return;
    }

    if (file.storagePath) {
      const { error: storageError } = await supabaseClient.storage.from("work-order-files").remove([file.storagePath]);
      if (storageError) {
        showToast(`No se pudo borrar el archivo del storage: ${storageError.message}`);
        return;
      }
    }

    const { error: fileError } = await supabaseClient.from("work_order_files").delete().eq("id", file.id);
    if (fileError) {
      showToast(`No se pudo eliminar el registro del archivo: ${fileError.message}`);
      return;
    }

    await supabaseClient.from("work_order_activity").insert({
      work_order_id: order.dbId,
      actor_id: dataState.session?.user?.id,
      action: "file_deleted",
      details: { file_name: file.name },
    });
    await queueWorkOrderUpdateEmails(order, [`Archivo eliminado: ${file.name}`], 0);
    await loadSupabaseData();
    showToast(`Archivo eliminado de ${order.id}`);
    render();
    return;
  }

  const files = orderFiles(order);
  files.splice(index, 1);
  order.files = files;
  order.updatedAt = new Date().toISOString();
  saveWorkOrders();
  showToast(`Archivo eliminado de ${order.id}`);
  render();
}

function statusMigrationMessage(message = "") {
  return message.includes("work_order_status") || message.includes("client_approved") || message.includes("scheduled")
    ? "Supabase no aceptó ese estado. Usa Nueva, En proceso, En revisión, Entregada o Cancelada."
    : "";
}

async function setWorkOrderStatus(order, nextStatus) {
  if (!canManageWorkOrders()) {
    showToast("Solo Dirección o Cuentas puede modificar estados");
    return;
  }
  if (!order) return;
  if (!nextStatus || nextStatus === order.status) {
    showToast("Selecciona un estado diferente");
    return;
  }

  if (isSupabaseMode()) {
    const { error } = await supabaseClient
      .from("work_orders")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", order.dbId);
    if (error) {
      const migrationMessage = statusMigrationMessage(error.message || "");
      showToast(migrationMessage || `No se pudo cambiar el estado: ${error.message}`);
      return;
    }
    const updatedOrderForEmail = { ...order, status: nextStatus, updatedAt: new Date().toISOString() };
    await supabaseClient.from("work_order_activity").insert({
      work_order_id: order.dbId,
      actor_id: dataState.session?.user?.id,
      action: "status_changed",
      details: { from: order.status, to: nextStatus },
    });
    await queueWorkOrderUpdateEmails(
      updatedOrderForEmail,
      [`Estado: ${workOrderStatusLabels[order.status] || order.status} -> ${workOrderStatusLabels[nextStatus] || nextStatus}`],
    );
    await loadSupabaseData();
    state.viewingWorkOrderId = updatedOrderForEmail.id;
    state.focusedWorkOrderId = updatedOrderForEmail.id;
    showToast(`${order.id} cambió a ${workOrderStatusLabels[nextStatus]}`);
    render();
    return;
  }

  order.status = nextStatus;
  order.updatedAt = new Date().toISOString();
  if (order.linkedContentId && order.status === "completed") {
    const linked = contentItems.find((item) => item.id === order.linkedContentId);
    if (linked && linked.status !== "approved") linked.status = "internal_review";
    saveContentItems();
  }
  saveWorkOrders();
  state.viewingWorkOrderId = order.id;
  state.focusedWorkOrderId = order.id;
  showToast(`${order.id} cambió a ${workOrderStatusLabels[order.status]}`);
  render();
}

function createNoPhaseStatusOperationId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto?.getRandomValues?.(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function focusNoPhaseStatusDialog() {
  window.setTimeout(() => {
    const dialog = document.querySelector(".no-phase-status-modal");
    const reason = dialog?.querySelector("[data-no-phase-status-reason]");
    const firstButton = dialog?.querySelector("button:not([disabled])");
    (reason || firstButton)?.focus();
  }, 0);
}

function closeNoPhaseOrderStatusDialog({ restoreFocus = true } = {}) {
  if (state.noPhaseOrderStatusProcessingId) return;
  const dialog = state.noPhaseOrderStatusDialog;
  state.noPhaseOrderStatusDialog = null;
  render();
  if (restoreFocus && dialog) {
    window.setTimeout(() => {
      document
        .querySelector(`[data-action="request-no-phase-order-status"][data-next-status="${CSS.escape(dialog.nextStatus)}"]`)
        ?.focus();
    }, 0);
  }
}

async function requestNoPhaseOrderStatusChange(id, nextStatus) {
  const order = workOrders.find((candidate) => candidate.id === id || candidate.dbId === id);
  if (!order || !nextStatus) return;
  if (state.noPhaseOrderStatusProcessingId) return;
  if (order.status === nextStatus) return;
  if (!noPhaseStatusTransitionAllowed(order, nextStatus)) {
    showToast("No tienes permiso para realizar esa transición o la orden contiene fases.");
    return;
  }

  const targetOrderId = order.dbId || order.id;
  const needsConfirmation = nextStatus === "completed"
    || nextStatus === "cancelled"
    || (["completed", "cancelled"].includes(order.status) && nextStatus === "in_progress");
  const operationId = createNoPhaseStatusOperationId();

  if (needsConfirmation) {
    state.noPhaseOrderStatusDialog = {
      orderId: targetOrderId,
      nextStatus,
      operationId,
      reason: "",
      error: "",
    };
    render();
    focusNoPhaseStatusDialog();
    return;
  }

  await transitionNoPhaseWorkOrderStatus(order, nextStatus, operationId, "");
}

async function confirmNoPhaseOrderStatusChange() {
  const dialog = state.noPhaseOrderStatusDialog;
  if (!dialog || state.noPhaseOrderStatusProcessingId) return;
  const order = workOrders.find((candidate) => (candidate.dbId || candidate.id) === dialog.orderId);
  if (!order) {
    closeNoPhaseOrderStatusDialog();
    return;
  }

  const reason = document.querySelector("[data-no-phase-status-reason]")?.value.trim() || "";
  const requiresReason = dialog.nextStatus === "cancelled"
    || (["completed", "cancelled"].includes(order.status) && dialog.nextStatus === "in_progress");
  if (requiresReason && !reason) {
    state.noPhaseOrderStatusDialog = {
      ...dialog,
      reason,
      error: "Escribe un motivo antes de confirmar.",
    };
    render();
    focusNoPhaseStatusDialog();
    return;
  }

  await transitionNoPhaseWorkOrderStatus(order, dialog.nextStatus, dialog.operationId, reason);
}

async function transitionNoPhaseWorkOrderStatus(order, nextStatus, operationId, reason = "") {
  const targetOrderId = order?.dbId || order?.id || "";
  if (!targetOrderId || state.noPhaseOrderStatusProcessingId) return;
  const previousDialog = state.noPhaseOrderStatusDialog;
  state.noPhaseOrderStatusDialog = null;
  state.noPhaseOrderStatusProcessingId = targetOrderId;
  render();

  try {
    const { data, error } = await supabaseClient
      .rpc("transition_work_order_without_phases", {
        target_work_order_id: targetOrderId,
        next_status: nextStatus,
        operation_id: operationId,
        change_reason: reason || null,
      })
      .single();

    if (error) {
      debugInteraction("work-order-without-phases:status:error", {
        orderId: targetOrderId,
        code: order.id,
        nextStatus,
        operationId,
        errorCode: error.code || "",
        message: error.message || "",
        details: error.details || "",
      });
      if (previousDialog) {
        state.noPhaseOrderStatusDialog = {
          ...previousDialog,
          reason,
          error: error.message || "No se pudo actualizar el estado.",
        };
      }
      showToast(error.message || "No se pudo actualizar el estado de la orden.");
      return;
    }

    order.status = data?.status || nextStatus;
    order.updatedAt = data?.updated_at || new Date().toISOString();
    state.viewingWorkOrderId = order.id;
    state.focusedWorkOrderId = order.id;
    debugInteraction("work-order-without-phases:status:success", {
      orderId: targetOrderId,
      code: order.id,
      previousStatus: data?.previous_status || "",
      status: order.status,
      operationId: data?.event_id || operationId,
      eligibleRecipientCount: data?.eligible_recipient_count ?? 0,
      queuedCount: data?.queued_count ?? 0,
      idempotent: Boolean(data?.idempotent),
    });
    const recipientCount = Number(data?.eligible_recipient_count || 0);
    showToast(
      recipientCount
        ? "Estado actualizado. Las notificaciones fueron puestas en cola."
        : "Estado actualizado. No se encontraron otros involucrados con correo disponible.",
    );
  } finally {
    state.noPhaseOrderStatusProcessingId = "";
    render();
    if (state.noPhaseOrderStatusDialog) focusNoPhaseStatusDialog();
  }
}

async function updateOrderStatusFromSelect(id) {
  const order = workOrders.find((candidate) => candidate.id === id);
  if (!order) return;
  const select = document.querySelector(`[data-status-select="${id}"]`);
  await setWorkOrderStatus(order, select?.value);
}

function findWorkOrderPhaseById(phaseId) {
  for (const order of workOrders) {
    const phase = workOrderPhases(order).find((candidate) => candidate.id === phaseId || candidate.dbId === phaseId);
    if (phase) return { order, phase };
  }
  return null;
}

function phasePermissionMessage(errorMessage = "") {
  if (
    errorMessage.includes("complete_work_order_phase") ||
    errorMessage.includes("update_work_order_phase_status") ||
    errorMessage.includes("add_work_order_phase_comment") ||
    errorMessage.includes("work_order_phase_comments") ||
    errorMessage.includes("not_allowed_to_complete_phase") ||
    errorMessage.includes("not_allowed_to_update_phase_status") ||
    errorMessage.includes("not_allowed_to_comment_phase") ||
    errorMessage.includes("Could not find the function") ||
    errorMessage.includes("schema cache") ||
    errorMessage.includes("permission denied") ||
    errorMessage.includes("row-level security")
  ) {
    return "Falta activar permisos de fases en Supabase: ejecuta supabase/patch_work_order_phase_status_and_comments.sql";
  }
  return "";
}

function replaceLocalWorkOrderPhase(order, phaseId, updater) {
  if (!order) return null;
  let updatedPhase = null;
  order.phases = workOrderPhases(order).map((candidate) => {
    if (candidate.id !== phaseId && candidate.dbId !== phaseId) return candidate;
    updatedPhase = typeof updater === "function" ? updater(candidate) : { ...candidate, ...updater };
    return updatedPhase;
  });
  order.updatedAt = new Date().toISOString();
  return updatedPhase;
}

async function updateWorkOrderPhaseStatus(phaseId, nextStatus) {
  if (!phaseId || !nextStatus) {
    throw new Error("Falta phaseId o nextStatus para actualizar la fase.");
  }
  const found = findWorkOrderPhaseById(phaseId);
  if (!found) {
    showToast("No encontré esa fase");
    render();
    return false;
  }
  const { order, phase } = found;
  const allowedStatuses = Object.keys(workOrderPhaseEditableStatusLabels);
  if (!allowedStatuses.includes(nextStatus)) {
    showToast("Estado de fase no válido");
    render();
    return false;
  }
  if (!canUpdateWorkOrderPhaseStatus(phase, order)) {
    showToast("Solo puedes cambiar fases asignadas a ti.");
    render();
    return false;
  }
  if (phase.status === nextStatus) return false;

  const previousStatus = phase.status;
  const completedAt = nextStatus === "completed" ? phase.completedAt || new Date().toISOString() : null;
  debugInteraction("phase-status:before-rpc", {
    phaseId,
    targetId: phase.dbId || phase.id,
    nextStatus,
    previousStatus,
  });

  if (isSupabaseMode()) {
    const targetId = phase.dbId || phase.id;
    debugInteraction("phase-status:update:start", {
      rpc: "update_work_order_phase_status",
      phaseId,
      targetId,
      previousStatus,
      nextStatus,
      currentUserId: dataState.session?.user?.id || "",
      payload: {
        target_phase_id: targetId,
        next_status: nextStatus,
      },
    });
    const { data, error } = await supabaseClient.rpc("update_work_order_phase_status", {
      target_phase_id: targetId,
      next_status: nextStatus,
    });
    debugInteraction("phase-status:update:response", {
      rpc: "update_work_order_phase_status",
      phaseId,
      targetId,
      nextStatus,
      data,
      result: Array.isArray(data) ? data[0] : data,
      returnedStatus: Array.isArray(data) ? data[0]?.status : data?.status,
      error: error?.message || "",
      errorDetails: error?.details || error?.hint || error?.code || "",
    });
    if (error) {
      debugInteraction("phase-status:update:error", { phaseId, targetId, nextStatus, message: error.message || "" });
      showToast(phasePermissionMessage(error.message || "") || `No se pudo actualizar la fase: ${error.message}`);
      render();
      return false;
    }
    const updatedRow = Array.isArray(data) ? data[0] : data;
    const localPhaseBefore = { ...phase };
    const updatedStatus = updatedRow?.status ?? nextStatus;
    const updatedCompletedAt =
      updatedRow?.completed_at ??
      updatedRow?.completedAt ??
      (updatedStatus === "completed" ? new Date().toISOString() : null);
    replaceLocalWorkOrderPhase(order, phase.id, (candidate) => ({
      ...candidate,
      status: updatedStatus,
      completedAt: updatedCompletedAt,
      updatedAt: updatedRow?.updated_at || new Date().toISOString(),
    }));
    const localPhaseAfter = workOrderPhases(order).find((candidate) => candidate.id === phase.id || candidate.dbId === targetId);
    debugInteraction("phase-status:local-update", {
      phaseId,
      targetId,
      updatedStatus,
      updatedCompletedAt,
      localPhaseBefore,
      localPhaseAfter,
    });
    await refreshSupabaseData({ silent: true, preserveNavigation: true });
  } else {
    replaceLocalWorkOrderPhase(order, phase.id, {
      status: nextStatus,
      completedAt,
      updatedAt: new Date().toISOString(),
    });
    saveWorkOrders();
  }

  state.viewingWorkOrderId = order.id;
  state.focusedWorkOrderId = order.id;
  const phaseBeforeRender = workOrderPhases(order).find((candidate) => candidate.id === phase.id || candidate.dbId === (phase.dbId || phase.id));
  debugInteraction("phase-status:rerender", {
    selectedWorkOrderId: state.viewingWorkOrderId,
    focusedWorkOrderId: state.focusedWorkOrderId,
    currentView: state.currentModule,
    phaseId,
    phaseBeforeRender,
  });
  showToast(`Fase actualizada: ${workOrderPhaseStatusLabels[nextStatus] || nextStatus}`);
  render();
  return true;
}

async function completeWorkOrderPhase(phaseId) {
  const found = findWorkOrderPhaseById(phaseId);
  if (!found) {
    showToast("No encontré esa fase");
    return;
  }
  const { order, phase } = found;
  if (!canCompleteWorkOrderPhase(phase, order)) {
    debugInteraction("phase-complete-blocked", {
      phaseId,
      orderId: order.id,
      phaseAssignedTo: phase.assignedTo || phase.assigned_to || "",
      orderCanOpen: canOpenWorkOrder(order),
    });
    showToast("Solo puedes completar fases asignadas a ti.");
    return;
  }
  const completedAt = new Date().toISOString();

  if (isSupabaseMode()) {
    const targetId = phase.dbId || phase.id;
    const { error } = await supabaseClient.rpc("complete_work_order_phase", {
      target_phase_id: targetId,
    });
    if (error) {
      showToast(phasePermissionMessage(error.message || "") || `No se pudo completar la fase: ${error.message}`);
      return;
    }
    await loadSupabaseData();
  } else {
    order.phases = workOrderPhases(order).map((candidate) =>
      candidate.id === phase.id
        ? { ...candidate, status: "completed", completedAt, updatedAt: completedAt }
        : candidate,
    );
    order.updatedAt = completedAt;
    saveWorkOrders();
  }

  state.viewingWorkOrderId = order.id;
  state.focusedWorkOrderId = order.id;
  showToast(`Fase completada: ${phase.title}`);
  render();
}

async function addWorkOrderPhaseComment(phaseId) {
  if (state.workOrderPhaseCommentPublishingIds.has(phaseId)) return;
  const found = findWorkOrderPhaseById(phaseId);
  if (!found) {
    showToast("No encontré esa fase");
    return;
  }
  const { order, phase } = found;
  if (!canCommentOnWorkOrderPhase(phase, order)) {
    showToast("Solo puedes comentar en fases asignadas a ti.");
    return;
  }
  const input = Array.from(document.querySelectorAll("[data-phase-comment-input]")).find(
    (candidate) => candidate.dataset.phaseCommentInput === phaseId,
  );
  const body = input?.value?.trim() || "";
  if (!body) {
    showToast("Escribe un avance antes de guardar");
    return;
  }
  if (body.length > 2000) {
    showToast("El comentario no debe superar 2000 caracteres");
    return;
  }

  state.workOrderPhaseCommentPublishingIds.add(phaseId);
  const submitButton = input?.closest(".phase-comment-form")?.querySelector('[data-action="add-work-order-phase-comment"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    submitButton.textContent = "Publicando...";
  }
  let published = false;
  try {
    if (isSupabaseMode()) {
      const targetId = phase.dbId || phase.id;
      debugInteraction("phase-comment:add:start", {
        rpc: "add_work_order_phase_comment",
        phaseId,
        targetId,
        bodyLength: body.length,
        bodyPreview: body.slice(0, 80),
        currentUserId: dataState.session?.user?.id || "",
        payload: {
          target_phase_id: targetId,
          comment_body: body,
        },
      });
      const { data, error } = await supabaseClient.rpc("add_work_order_phase_comment", {
        target_phase_id: targetId,
        comment_body: body,
      });
      debugInteraction("phase-comment:add:response", {
        rpc: "add_work_order_phase_comment",
        phaseId,
        targetId,
        data,
        result: Array.isArray(data) ? data[0] : data,
        commentId: Array.isArray(data) ? data[0]?.id : data?.id,
        error: error?.message || "",
        errorDetails: error?.details || error?.hint || error?.code || "",
      });
      if (error) {
        debugInteraction("phase-comment:add:error", { phaseId, targetId, message: error.message || "" });
        showToast(phasePermissionMessage(error.message || "") || `No se pudo guardar el comentario: ${error.message}`);
        return;
      }
      const insertedComment = mapDbWorkOrderPhaseComment(Array.isArray(data) ? data[0] : data);
      replaceLocalWorkOrderPhase(order, phase.id, (candidate) => ({
        ...candidate,
        comments: [...(candidate.comments || []), insertedComment],
      }));
      if (input) input.value = "";
      await refreshSupabaseData({ silent: true, preserveNavigation: true });
    } else {
      replaceLocalWorkOrderPhase(order, phase.id, (candidate) => ({
        ...candidate,
        comments: [
          ...(candidate.comments || []),
          {
            id: `phase-comment-${Date.now()}`,
            workOrderId: order.dbId || order.id,
            phaseId: phase.dbId || phase.id,
            authorId: currentProfileId() || "giu",
            body,
            createdAt: new Date().toISOString(),
            updatedAt: "",
          },
        ],
      }));
      if (input) input.value = "";
      saveWorkOrders();
    }

    state.viewingWorkOrderId = order.id;
    state.focusedWorkOrderId = order.id;
    published = true;
    showToast("Comentario publicado. Las notificaciones fueron puestas en cola.");
  } finally {
    state.workOrderPhaseCommentPublishingIds.delete(phaseId);
    if (published) {
      render();
    } else if (submitButton) {
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
      submitButton.textContent = "Agregar comentario";
    }
  }
}

function openWorkOrderCommentReply(commentId) {
  const order = selectedViewingOrder();
  const conversation = workOrderConversationState(order);
  const rootComment = conversation.comments.find(
    (comment) => comment.id === commentId && !comment.parentCommentId,
  );
  if (!order || !rootComment || !canParticipateInWorkOrderConversation(order)) {
    showToast("No puedes responder en este tema.");
    return;
  }
  if (rootComment.resolutionStatus === "resolved") {
    showToast("Este tema ya está resuelto.");
    return;
  }
  state.workOrderConversationReplyingTo = commentId;
  render();
  window.setTimeout(() => {
    document.querySelector("[data-conversation-reply-message]")?.focus();
  }, 0);
}

function closeWorkOrderCommentReply() {
  const order = selectedViewingOrder();
  if (order && state.workOrderConversationReplyingTo) {
    clearWorkOrderMentionDraft(order, state.workOrderConversationReplyingTo);
  }
  state.workOrderConversationReplyingTo = "";
  render();
}

function workOrderCommentRpcRow(data) {
  return Array.isArray(data) ? data[0] : data;
}

async function publishWorkOrderComment(orderId = "", parentCommentId = "", actionElement = null) {
  const order = orderId ? findWorkOrderByAnyId(orderId) : selectedViewingOrder();
  if (!order || !order.dbId || !canParticipateInWorkOrderConversation(order)) {
    showToast("No puedes publicar en la conversación de esta orden.");
    return;
  }

  const form = parentCommentId
    ? Array.from(document.querySelectorAll("[data-conversation-reply-form]")).find(
        (candidate) => candidate.dataset.conversationReplyForm === parentCommentId,
      )
    : document.querySelector("[data-work-order-conversation-form]");
  const message = form?.querySelector(
    parentCommentId ? "[data-conversation-reply-message]" : "[data-conversation-message]",
  )?.value?.trim() || "";
  const commentType = form?.querySelector(
    parentCommentId ? "[data-conversation-reply-type]" : "[data-conversation-type]",
  )?.value || "comment";
  const requiresResponse = parentCommentId
    ? false
    : Boolean(form?.querySelector("[data-conversation-requires-response]")?.checked);
  const structuredMentions = reconcileWorkOrderMentionDraft(order, parentCommentId, message);
  const mentionedUserIds = Array.from(new Set(structuredMentions.map((mention) => mention.userId)));

  if (!message) {
    showToast(parentCommentId ? "Escribe una respuesta antes de publicar." : "Escribe un mensaje antes de publicar.");
    return;
  }
  if (message.length > 4000) {
    showToast("El mensaje no debe superar 4000 caracteres.");
    return;
  }

  state.workOrderConversationPublishing = true;
  if (actionElement) {
    actionElement.disabled = true;
    actionElement.setAttribute("aria-busy", "true");
  }
  debugInteraction("work-order-conversation:create-start", {
    orderId: order.dbId,
    code: order.id,
    parentCommentId,
    commentType,
    requiresResponse,
    messageLength: message.length,
  });

  try {
    const { data, error } = await supabaseClient.rpc("create_work_order_comment", {
      target_work_order_id: order.dbId,
      comment_message: message,
      next_comment_type: commentType,
      needs_response: requiresResponse,
      target_parent_comment_id: parentCommentId || null,
      mentioned_user_ids: mentionedUserIds,
    });
    if (error) {
      debugInteraction("work-order-conversation:create-error", {
        orderId: order.dbId,
        parentCommentId,
        code: error.code || "",
        message: error.message || "",
      });
      showToast(`No se pudo publicar: ${error.message}`);
      return;
    }

    await loadWorkOrderConversation(order, { force: true });
    clearWorkOrderMentionDraft(order, parentCommentId);
    state.workOrderConversationReplyingTo = "";
    showToast("Comentario publicado. Las notificaciones fueron puestas en cola.");
  } finally {
    state.workOrderConversationPublishing = false;
    render();
  }
}

async function resolveWorkOrderComment(commentId, actionElement = null) {
  const order = selectedViewingOrder();
  const conversation = workOrderConversationState(order);
  const rootComment = conversation.comments.find(
    (comment) => comment.id === commentId && !comment.parentCommentId,
  );
  if (!order || !rootComment || !canResolveWorkOrderConversationTopic(order, rootComment)) {
    showToast("No puedes resolver este tema.");
    return;
  }
  if (!window.confirm("¿Marcar este tema como resuelto? La conversación permanecerá visible.")) return;

  state.workOrderConversationResolvingId = commentId;
  if (actionElement) {
    actionElement.disabled = true;
    actionElement.setAttribute("aria-busy", "true");
  }

  try {
    const { data, error } = await supabaseClient.rpc("resolve_work_order_comment", {
      target_comment_id: commentId,
    });
    if (error) {
      debugInteraction("work-order-conversation:resolve-error", {
        orderId: order.dbId,
        commentId,
        code: error.code || "",
        message: error.message || "",
      });
      showToast(`No se pudo resolver el tema: ${error.message}`);
      return;
    }

    const row = workOrderCommentRpcRow(data);
    setWorkOrderConversationState(order, {
      comments: conversation.comments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              resolutionStatus: row?.resolution_status || "resolved",
              resolvedBy: row?.resolved_by || currentProfileId(),
              resolvedAt: row?.resolved_at || new Date().toISOString(),
              updatedAt: row?.updated_at || new Date().toISOString(),
            }
          : comment,
      ),
    });
    state.workOrderConversationReplyingTo = "";
    showToast("Tema marcado como resuelto.");
  } finally {
    state.workOrderConversationResolvingId = "";
    render();
  }
}

async function setOrderStatusFromButton(payload = "") {
  const [id, status] = String(payload).split("::");
  const order = workOrders.find((candidate) => candidate.id === id);
  if (!order || !status) return;
  await setWorkOrderStatus(order, status);
  render();
}

async function advanceWorkOrder(id) {
  if (!canManageWorkOrders()) {
    showToast("Solo Dirección o Cuentas puede modificar órdenes");
    return;
  }
  const order = workOrders.find((candidate) => candidate.id === id);
  if (!order) return;
  const nextStatus = nextWorkOrderStatus(order);
  if (!nextStatus) {
    showToast("Esta OT ya no tiene un siguiente estado automatico");
    return;
  }

  await setWorkOrderStatus(order, nextStatus);
}

function archiveMigrationMessage(message = "") {
  if (message.includes("not_allowed_to_archive_work_order")) {
    return "Tu usuario no tiene permiso para archivar esta OT o no tiene acceso a la marca.";
  }
  return message.includes("archived_at") ||
    message.includes("archive_work_order") ||
    message.includes("can_archive_work_orders") ||
    message.includes("Could not find the function") ||
    message.includes("schema cache") ||
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("column")
    ? "Falta actualizar el archivo de OTs en Supabase: ejecuta supabase/patch_work_order_archive.sql"
    : "";
}

function toggleArchivedWorkOrders() {
  state.showArchivedWorkOrders = !state.showArchivedWorkOrders;
  state.workOrderFilters.quick = state.showArchivedWorkOrders ? "archived" : "";
  state.editingWorkOrderId = "";
  state.viewingWorkOrderId = "";
  state.focusedWorkOrderId = "";
  showToast(state.showArchivedWorkOrders ? "Mostrando OTs archivadas" : "Mostrando panel activo");
  render();
}

async function setWorkOrderArchived(id, shouldArchive) {
  if (!canArchiveWorkOrders()) {
    showToast("Solo Admin, Dirección, Cuentas, Generador o Creativo puede archivar órdenes");
    return;
  }
  const order = workOrders.find((candidate) => candidate.id === id);
  if (!order) return;
  if (shouldArchive) {
    const confirmed = window.confirm(`Archivar ${order.id}? La OT saldra del panel activo, pero no se borrara y podras restaurarla.`);
    if (!confirmed) return;
  }
  if (isArchivedWorkOrder(order) === shouldArchive) {
    showToast(shouldArchive ? "Esta OT ya esta archivada" : "Esta OT ya esta activa");
    return;
  }
  const archivedAt = shouldArchive ? new Date().toISOString() : null;

  if (isSupabaseMode()) {
    if (!order.dbId) {
      showToast("No se pudo archivar: esta OT no tiene ID de Supabase.");
      return;
    }
    const { error } = await supabaseClient.rpc("archive_work_order", {
      target_work_order_id: order.dbId,
      should_archive: shouldArchive,
    });
    if (error) {
      showToast(archiveMigrationMessage(error.message || "") || `No se pudo ${shouldArchive ? "archivar" : "restaurar"} la OT: ${error.message}`);
      return;
    }
    const updatedOrderForEmail = { ...order, archivedAt };
    await queueWorkOrderUpdateEmails(
      updatedOrderForEmail,
      [shouldArchive ? "OT archivada y retirada del panel operativo" : "OT restaurada al panel operativo"],
    );
    await loadSupabaseData();
  } else {
    order.archivedAt = archivedAt;
    order.updatedAt = new Date().toISOString();
    saveWorkOrders();
  }

  state.editingWorkOrderId = "";
  state.viewingWorkOrderId = "";
  state.focusedWorkOrderId = shouldArchive ? "" : order.id;
  showToast(shouldArchive ? `${order.id} archivada` : `${order.id} restaurada`);
}

async function archiveWorkOrder(id) {
  await setWorkOrderArchived(id, true);
}

async function unarchiveWorkOrder(id) {
  await setWorkOrderArchived(id, false);
}

async function persistBrandEmailRecipients(recipientIds) {
  const brandId = state.notificationBrandId;
  if (!brandId) {
    showToast("Selecciona una marca");
    return false;
  }
  if (!(canManageWorkOrders() || isSystemAdmin())) {
    showToast("Solo Dirección o Cuentas puede editar destinatarios por marca");
    return false;
  }

  if (isSupabaseMode()) {
    const { error: deleteError } = await supabaseClient.from("brand_notification_recipients").delete().eq("brand_id", brandId);
    if (deleteError) {
      showToast("Falta activar la tabla de destinatarios por marca en Supabase");
      return false;
    }
    if (recipientIds.length) {
      const { error: insertError } = await supabaseClient.from("brand_notification_recipients").insert(
        recipientIds.map((userId) => ({ brand_id: brandId, user_id: userId })),
      );
      if (insertError) {
        showToast(`No se pudo guardar destinatarios: ${insertError.message}`);
        return false;
      }
    }
    await loadSupabaseData();
  } else {
    const nextRecipients = [
      ...brandNotificationRecipients.filter((recipient) => recipient.brandId !== brandId),
      ...recipientIds.map((userId) => ({ brandId, userId })),
    ];
    setCollection(brandNotificationRecipients, nextRecipients);
    localStorage.setItem("lumen_brand_notification_recipients_v1", JSON.stringify(brandNotificationRecipients));
  }

  showToast(recipientIds.length ? "Destinatarios de la marca actualizados" : "La marca usara los responsables de cada OT");
  render();
  return true;
}

async function saveBrandEmailRecipients() {
  const recipientIds = Array.from(document.querySelectorAll("[data-brand-email-recipient]:checked")).map((input) => input.value);
  await persistBrandEmailRecipients(recipientIds);
}

async function clearBrandEmailRecipients() {
  const confirmed = window.confirm("¿Quitar la lista fija? Los correos de esta marca se enviarán a los responsables seleccionados en cada OT.");
  if (!confirmed) return;
  await persistBrandEmailRecipients([]);
}

function previewWeeklyDigest() {
  const totalOpen = workOrders.filter(isOpenWorkOrder).length;
  const totalOverdue = workOrders.filter((order) => isOpenWorkOrder(order) && daysUntil(order.dueDate) < 0).length;
  showToast(`Resumen semanal: ${totalOpen} OTs abiertas y ${totalOverdue} vencidas. Esto solo es vista previa.`);
}

function redactFunctionPayload(payload = {}) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, key.toLowerCase().includes("triggered") ? "[current-user]" : value]),
  );
}

async function readEdgeFunctionError(error) {
  const details = {
    message: error?.message || "Edge Function error",
    status: null,
    body: null,
  };
  const response = error?.context || error?.response;
  if (response && typeof response.clone === "function") {
    details.status = response.status || null;
    const text = await response.clone().text().catch(() => "");
    if (text) {
      try {
        details.body = JSON.parse(text);
      } catch {
        details.body = text;
      }
    }
  }
  return details;
}

function emailWorkerResultMessage(prefix, data) {
  const results = Array.isArray(data?.results) ? data.results : [];
  const sent = results.filter((item) => item.status === "sent").length;
  const failed = results.filter((item) => item.status === "failed").length;
  return `${prefix}: ${data?.processed ?? 0} procesados · ${sent} enviados · ${failed} fallidos`;
}

function edgeFunctionFailureMessage(functionName, details) {
  const names = {
    "daily-activity-digest": "resumen diario",
    "weekly-digest": "resumen semanal",
    "email-worker": "envío de correos pendientes",
  };
  const label = names[functionName] || functionName;
  const bodyText = typeof details.body === "string" ? details.body : JSON.stringify(details.body || {});
  if (functionName === "daily-activity-digest" && bodyText.includes("daily_digest")) {
    return "No se pudo preparar el resumen diario. Revisa si supabase/patch_daily_activity_digest.sql ya fue ejecutado y consulta logs de Supabase.";
  }
  if (functionName === "email-worker" && bodyText.includes("Missing environment variables")) {
    return "No se pudieron enviar correos: faltan variables de email en Supabase Functions.";
  }
  return `No se pudo ejecutar ${label}. Revisa logs de Supabase Edge Function.`;
}

async function invokeEmailFunction(functionName, successMessage, extraBody = {}, options = {}) {
  if (!isSupabaseMode()) {
    showToast("Conecta Supabase para usar emails reales");
    return null;
  }
  const { allowCreators = false } = options || {};
  if (!(canManageWorkOrders() || (allowCreators && canRunOperationalEmail()))) {
    showToast("Solo roles operativos autorizados pueden disparar automatizaciones");
    return null;
  }

  try {
    const safeExtraBody = typeof extraBody === "function" ? {} : extraBody;
    if (typeof extraBody === "function") {
      console.warn("[Lumen Edge Function warning]", {
        functionName,
        warning: "invokeEmailFunction received a function as extraBody; ignoring it. Pass a plain object as the third argument.",
      });
    }
    const payload = { triggered_by: dataState.session?.user?.id, ...safeExtraBody };
    const { data, error } = await supabaseClient.functions.invoke(functionName, {
      body: payload,
    });
    if (error) throw error;
    showToast(typeof successMessage === "function" ? successMessage(data) : successMessage);
    await loadSupabaseData().catch(() => null);
    render();
    return data;
  } catch (error) {
    const details = await readEdgeFunctionError(error);
    dataState.lastEmailFunctionError = {
      functionName,
      status: details.status,
      message: details.message,
      body: details.body,
      at: new Date().toISOString(),
    };
    console.warn("[Lumen Edge Function error]", {
      functionName,
      status: details.status,
      error: details.message,
      details: details.body,
      payload: redactFunctionPayload({ triggered_by: dataState.session?.user?.id, ...safeExtraBody }),
    });
    showToast(edgeFunctionFailureMessage(functionName, details));
    return null;
  }
}

async function queueWeeklyDigest() {
  return invokeEmailFunction(
    "weekly-digest",
    (data) => `Correos preparados para ${data?.queued ?? 0} personas. Aun no se han enviado.`,
  );
}

async function queueDailyDigest() {
  return invokeEmailFunction(
    "daily-activity-digest",
    (data) => `Resumen diario preparado para ${data?.queued ?? 0} personas con ${data?.activities ?? 0} cambios.`,
  );
}

async function sendEmailQueue() {
  const confirmed = window.confirm(
    "Esto enviara los correos que ya estan preparados usando Brevo. Si hay correos pendientes, el equipo los recibira ahora. ¿Enviar pendientes?",
  );
  if (!confirmed) return null;

  return invokeEmailFunction(
    "email-worker",
    (data) => emailWorkerResultMessage("Correos pendientes revisados", data),
  );
}

async function runWeeklyDigestNow() {
  const confirmed = window.confirm(
    "Esto preparara el resumen semanal y lo enviara de inmediato al equipo interno activo. ¿Preparar y enviar ahora?",
  );
  if (!confirmed) return;

  const queued = await queueWeeklyDigest();
  if (!queued) return;
  await invokeEmailFunction(
    "email-worker",
    (data) => emailWorkerResultMessage("Resumen semanal enviado/revisado", data),
  );
}

async function runDailyDigestNow() {
  const confirmed = window.confirm(
    "Esto preparará un solo resumen con los cambios de las últimas 24 horas y lo enviará ahora. ¿Continuar?",
  );
  if (!confirmed) return;

  const queued = await queueDailyDigest();
  if (!queued) return;
  await invokeEmailFunction(
    "email-worker",
    (data) => emailWorkerResultMessage("Resumen diario enviado/revisado", data),
  );
}

function approveAsset(id) {
  assetVersions = assetVersions.map((asset) =>
    asset.id === id
      ? {
          ...asset,
          status: "approved",
          approved: true,
        }
      : asset,
  );
  showToast("Version visual aprobada");
}

function sendClientReview() {
  if (isAllBrandsScope()) {
    showToast("Selecciona una marca para enviar calendario a cliente");
    return;
  }
  contentItems = contentItems.map((item) =>
    item.brandId === state.currentBrandId && item.status === "internal_review"
      ? { ...item, status: "client_review" }
      : item,
  );
  saveContentItems();
  showToast("Calendario enviado a revisión de cliente");
}

function createContent(prefix = "Nueva pieza") {
  if (isAllBrandsScope()) {
    showToast("Selecciona una marca para crear contenido");
    return;
  }
  const nextIndex = contentItems.length + 1;
  const brand = getBrand();
  const titleInput = document.getElementById("concept-title");
  const briefInput = document.getElementById("concept-brief");
  const date = new Date("2026-05-15T10:00:00");
  date.setDate(15 + (nextIndex % 9));
  const item = {
    id: `ci-new-${Date.now()}`,
    calendarId: `cal-${brand.clientId}-may`,
    brandId: brand.id,
    title: titleInput?.value.trim() || `${prefix} ${brand.shortName}`,
    platform: brand.platforms[0],
    format: brand.platforms[0] === "TikTok" ? "Video" : "Post estatico",
    pillar: "Educativo",
    scheduledAt: date.toISOString(),
    status: "draft",
    owner: "giu",
    stage: "concept",
    workOrderId: null,
    productionId: null,
    assetVersionId: null,
    caption: briefInput?.value.trim() || "Draft pendiente de ajustar con el contexto final de la marca.",
    comments: [],
  };
  contentItems.push(item);
  state.selectedContentId = item.id;
  state.currentModule = "content";
  state.contentView = "concept";
  saveContentItems();
  showToast("Pieza creada en calendario");
}

function showToast(message) {
  state.toast = message;
  render();
  window.setTimeout(() => {
    state.toast = "";
    render();
  }, 2200);
}

function syncOpenWorkOrderDraftBeforeSuspend() {
  if (state.creatingWorkOrder || document.getElementById("ot-title")) {
    syncWorkOrderFormDraftFromForm();
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") syncOpenWorkOrderDraftBeforeSuspend();
});
window.addEventListener("pagehide", syncOpenWorkOrderDraftBeforeSuspend);

initializeApp();
