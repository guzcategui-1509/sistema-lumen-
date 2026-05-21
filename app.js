const modules = [
  { key: "dashboard", label: "Dashboard", icon: "DB" },
  { key: "calendar", label: "Calendario", icon: "CA" },
  { key: "brands", label: "Marcas", icon: "BR" },
  { key: "brand-config", label: "Config. de marca", icon: "BR" },
  { key: "work-orders", label: "Órdenes de trabajo", icon: "OT" },
  { key: "notifications", label: "Notificaciones", icon: "NT" },
  { key: "productions", label: "Producciones", icon: "PR" },
  { key: "content", label: "Contenido", icon: "CO" },
  { key: "assets", label: "Assets / Canva", icon: "CA" },
  { key: "copywriting", label: "Copywriting IA", icon: "CP" },
  { key: "creativity", label: "Creatividad IA", icon: "IA" },
  { key: "reports", label: "Reportería", icon: "RP" },
  { key: "team", label: "Equipo", icon: "EQ" },
  { key: "client-portal", label: "Portal cliente", icon: "CL" },
  { key: "settings", label: "Admin", icon: "AD" },
];

const ALL_BRANDS_ID = "all-brands";
const OPERATIONS_MODE = true;
const operationalModuleKeys = ["dashboard", "work-orders", "calendar", "brands", "team", "reports", "notifications", "settings"];
const operationalNavGroups = [
  { label: "Operación", keys: ["dashboard", "work-orders", "calendar", "brands"] },
  { label: "Gestión", keys: ["team", "reports", "notifications"] },
  { label: "Sistema", keys: ["settings"] },
];
let supabaseClient = null;

function iconSvg(name, className = "ui-icon") {
  const icons = {
    dashboard: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    "work-orders": '<svg viewBox="0 0 24 24"><path d="M9 5h6"/><path d="M9 12h6"/><path d="M9 17h4"/><path d="M8 3h8l2 2v16H6V5l2-2z"/></svg>',
    notifications: '<svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
    reports: '<svg viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><rect x="7" y="11" width="3" height="5" rx="1"/><rect x="12" y="7" width="3" height="9" rx="1"/><rect x="17" y="9" width="3" height="7" rx="1"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>',
    team: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15 16.5a5 5 0 0 1 6 3.5"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 3.1a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 3.1h5l.3-3.1a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z"/></svg>',
    ai: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></svg>',
    alert: '<svg viewBox="0 0 24 24"><path d="M12 3l10 18H2L12 3z"/><path d="M12 9v5"/><path d="M12 18h.01"/></svg>',
    time: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    archive: '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M6 7v13h12V7"/><path d="M8 3h8l2 4H6l2-4z"/><path d="M10 12h4"/></svg>',
    brand: '<svg viewBox="0 0 24 24"><path d="M4 7l8-4 8 4v10l-8 4-8-4V7z"/><path d="M12 3v18"/><path d="M4 7l8 4 8-4"/></svg>',
    brands: '<svg viewBox="0 0 24 24"><path d="M4 7l8-4 8 4v10l-8 4-8-4V7z"/><path d="M12 3v18"/><path d="M4 7l8 4 8-4"/></svg>',
  };
  return `<span class="${className}" aria-hidden="true">${icons[name] || icons.dashboard}</span>`;
}

const dataState = {
  mode: "demo",
  loading: true,
  error: "",
  session: null,
  profile: null,
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

const users = loadStoredCollection("lumen_users_v1", []);

const demoWorkOrdersResetVersion = "2026-05-05-clean-work-orders";
if (localStorage.getItem("lumen_work_orders_reset_version") !== demoWorkOrdersResetVersion) {
  localStorage.removeItem("lumen_work_orders_v1");
  localStorage.setItem("lumen_work_orders_reset_version", demoWorkOrdersResetVersion);
}

let workOrders = [];

const initialWorkOrders = workOrders.map((order) => ({ ...order }));
workOrders = loadStoredCollection("lumen_work_orders_v1", initialWorkOrders);

const notificationRules = [
  {
    id: "assignment",
    title: "Asignación de OT",
    channel: "Correo + aviso dentro del sistema",
    recipients: "Responsables asignados",
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
    channel: "Correo inmediato",
    recipients: "Responsables de la orden",
    enabled: true,
  },
  {
    id: "supervisor-gate",
    title: "Revisión de jefe inmediato",
    channel: "Correo inmediato",
    recipients: "Dirección/Cuentas por marca",
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
    id: "monthly-content-matrix",
    title: "Matriz mensual de contenido",
    channel: "Orden automática + correo",
    recipients: "Cuentas + Generador/Creativo por marca",
    enabled: true,
  },
  {
    id: "monthly-paid-placement",
    title: "Colocación mensual de pauta",
    channel: "Orden automática + correo",
    recipients: "Cuentas + Medios/Pauta por marca",
    enabled: true,
  },
];

const weeklyDigestConfig = {
  day: "Lunes",
  time: "08:00",
  timezone: "America/Mexico_City",
  subject: "Lumen Workspace - tus OTs de la semana",
};

const workOrderManagerRoles = ["admin", "directora", "cuentas"];
const workOrderCreatorRoles = ["admin", "directora", "cuentas", "generador", "creativo"];
const workOrderMaterialRoles = ["admin", "directora", "cuentas", "generador", "creativo", "disenador", "editor"];

const supervisorGateCategories = ["diseno", "arte_final", "edicion", "produccion"];

const lumenProcessAreas = {
  diseno: {
    label: "Diseño / Creatividad",
    supervisorRoles: ["directora", "creativo", "cuentas"],
    executionRoles: ["disenador", "creativo", "editor"],
    steps: [
      ["Brief validado", "Cuentas confirma objetivo, target, entregables, fechas y presupuesto."],
      ["Asignación de jefe", "Dirección/Creatividad revisa la OT, asigna responsable y ajusta deadline."],
      ["Concepto y diseño", "Creativo/Diseño desarrolla propuesta visual alineada al brief."],
      ["Revisión interna", "Director de Arte o responsable valida calidad antes de cliente."],
      ["Cliente / cambios", "Cuentas presenta, recibe feedback y centraliza ajustes."],
      ["Entrega y cierre", "Se entregan versiones finales y Cuentas cierra oficialmente la OT."],
    ],
  },
  arte_final: {
    label: "Arte final",
    supervisorRoles: ["directora", "creativo", "cuentas"],
    executionRoles: ["disenador", "editor"],
    steps: [
      ["Brief y propuesta aprobada", "La solicitud entra con material o propuesta ya aprobada."],
      ["Asignación de jefe", "Dirección/Creatividad confirma responsable y tiempo de entrega."],
      ["Adaptaciones", "Arte final prepara formatos, resoluciones y versiones."],
      ["Revisión interna", "Se valida que el material esté listo para medios o cliente."],
      ["Ajustes finales", "Se corrigen observaciones puntuales antes de entrega."],
      ["Entrega y archivo", "Se suben finales a carpeta y se marca cierre."],
    ],
  },
  edicion: {
    label: "Edición / Post",
    supervisorRoles: ["directora", "operaciones", "creativo", "cuentas"],
    executionRoles: ["editor", "generador", "creativo"],
    steps: [
      ["Brief o matriz aprobada", "La edición parte de materiales e instrucciones aprobadas."],
      ["Asignación de jefe", "Producción/Operación asigna editor y deadline realista."],
      ["Primer corte", "Editor procesa materiales y arma versión inicial."],
      ["Revisión interna", "Responsable del proyecto revisa ritmo, copy, música y formatos."],
      ["Cambios", "Se aplica una ronda ordenada de ajustes."],
      ["Entrega final", "Se exportan y suben archivos optimizados."],
    ],
  },
  produccion: {
    label: "Producción",
    supervisorRoles: ["directora", "operaciones", "cuentas"],
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
    supervisorRoles: ["directora", "cuentas", "pauta"],
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
    supervisorRoles: ["directora", "cuentas", "creativo"],
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

const state = {
  currentModule: "dashboard",
  currentBrandId: ALL_BRANDS_ID,
  selectedContentId: "ci-silk-01",
  contentView: "concept",
  brandConfigSection: "identity",
  adminEditingUserId: "",
  editingWorkOrderId: "",
  viewingWorkOrderId: "",
  focusedWorkOrderId: "",
  dashboardMonth: "",
  workOrderMonth: "",
  showArchivedWorkOrders: false,
  workOrderFilters: {
    assignee: "",
    status: "",
    priority: "",
    due: "",
    quick: "",
  },
  reportMonth: "",
  reportStartDate: "",
  reportEndDate: "",
  initialRouteApplied: false,
  passwordResetMode: false,
  toast: "",
};

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
  cuentas: "Cuentas",
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
    slug: row.slug,
    color: row.color_primary || "#2d2d2d",
    platforms: row.platforms || [],
    services: row.services || [],
    monthlyGoal: 10,
    canvaFolder: "",
    isActive: row.is_active,
  };
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
    notifyOnEmail: row.notify_on_email,
    linkedContentId: null,
  };
}

async function loadSupabaseData() {
  if (!isSupabaseMode() || !dataState.session) return;

  const [profileResult, clientsResult, brandsResult, membershipsResult, profilesResult, ordersResult] = await Promise.all([
    supabaseClient.from("profiles").select("*").eq("id", dataState.session.user.id).maybeSingle(),
    supabaseClient.from("clients").select("*").order("name"),
    supabaseClient.from("brands").select("*").eq("is_active", true).order("name"),
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
  setCollection(users, (profilesResult.data || []).map((profile) => mapDbUser(profile, membershipsResult.data || [])));
  workOrders = (ordersResult.data || []).map(mapDbWorkOrder);

  if (!isAllBrandsScope() && !brands.some((brand) => brand.id === state.currentBrandId)) {
    state.currentBrandId = ALL_BRANDS_ID;
  }
}

async function initializeApp() {
  const hasSupabase = setupSupabaseClient();
  if (!hasSupabase) {
    dataState.mode = "demo";
    dataState.loading = false;
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
    }
  } catch (error) {
    dataState.error = error.message || "No se pudo conectar Supabase";
  } finally {
    dataState.loading = false;
    render();
  }

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    dataState.session = session;
    dataState.error = "";
    if (_event === "PASSWORD_RECOVERY") {
      dataState.passwordResetMode = true;
    }
    if (session) {
      dataState.loading = true;
      render();
      try {
        await loadSupabaseData();
        applyInitialRouteParams();
      } catch (error) {
        dataState.error = error.message || "No se pudo cargar Supabase";
      }
      dataState.loading = false;
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
            <span>${module.label}</span>
          </button>
        `,
      )
      .join("");
  }

  return operationalNavGroups
    .map((group) => {
      const groupModules = group.keys.map((key) => getModuleMeta(key)).filter(Boolean);
      return `
        <div class="nav-group">
          <div class="nav-group-label">${group.label}</div>
          ${groupModules
            .map(
              (module) => `
                <button class="nav-button ${module.key === state.currentModule ? "active" : ""}" data-module="${module.key}">
                  <span class="nav-icon">${iconSvg(module.key)}</span>
                  <span>${module.label}</span>
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

function canOpenModule(key) {
  return !OPERATIONS_MODE || operationalModuleKeys.includes(key);
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
  return `${getClient(brand.clientId).name} / ${brand.name}`;
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

function buildWorkOrderUrl(orderCode, brandId) {
  const url = new URL(getAppBaseUrl());
  url.searchParams.set("module", "work-orders");
  url.searchParams.set("brand", brandId);
  url.searchParams.set("ot", orderCode);
  return url.toString();
}

function applyInitialRouteParams() {
  if (state.initialRouteApplied) return;
  const params = new URLSearchParams(window.location.search);
  const moduleParam = params.get("module");
  const brandParam = params.get("brand");
  const orderParam = params.get("ot");

  if (moduleParam && canOpenModule(moduleParam)) {
    state.currentModule = moduleParam;
  }
  if (brandParam && (brandParam === ALL_BRANDS_ID || brands.some((brand) => brand.id === brandParam))) {
    state.currentBrandId = brandParam;
  }
  if (orderParam) {
    const order = workOrders.find((candidate) => candidate.id === orderParam || candidate.dbId === orderParam);
    state.currentModule = "work-orders";
    state.focusedWorkOrderId = order?.id || orderParam;
    state.viewingWorkOrderId = order?.id || orderParam;
    if (order?.brandId) state.currentBrandId = order.brandId;
  }

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
    ${clients
      .map(
        (clientItem) => `
        <optgroup label="${clientItem.name}">
          ${brands
            .filter((brandItem) => brandItem.clientId === clientItem.id)
            .map(
              (brandItem) => `
                <option value="${brandItem.id}" ${brandItem.id === activeBrandId ? "selected" : ""}>
                  ${brandItem.shortName}
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
      approvers: getClient(brand.clientId).name,
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

function isSystemAdmin() {
  return ["admin", "directora"].includes(dataState.profile?.role);
}

function canManageWorkOrders() {
  if (!isSupabaseMode()) return true;
  return workOrderManagerRoles.includes(dataState.profile?.role);
}

function canCreateWorkOrders() {
  if (!isSupabaseMode()) return true;
  return workOrderCreatorRoles.includes(dataState.profile?.role);
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

function parseDateValue(value, fallbackTime = "T12:00:00") {
  if (!value) return null;
  const text = String(value);
  const date = new Date(text.includes("T") ? text : `${text}${fallbackTime}`);
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
  const days = daysUntil(order.dueDate);
  if (days < 0) return { label: `Vencida hace ${Math.abs(days)}d`, cls: "red" };
  if (days === 0) return { label: "Vence hoy", cls: "red" };
  if (days === 1) return { label: "Vence mañana", cls: "amber" };
  return { label: `${days}d restantes`, cls: "blue" };
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

function requiresSupervisorGate(category = "diseno") {
  return supervisorGateCategories.includes(category);
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

function supervisorCandidates(category = "diseno", brandId = state.currentBrandId) {
  const area = workOrderProcessArea(category);
  const candidates = usersForBrandByRoles(area.supervisorRoles, brandId);
  if (candidates.length) return candidates;
  return usersForBrandByRoles(["admin", "directora", "cuentas"], brandId);
}

function executionCandidates(category = "diseno", brandId = state.currentBrandId) {
  const area = workOrderProcessArea(category);
  const candidates = usersForBrandByRoles(area.executionRoles, brandId);
  if (candidates.length) return candidates;
  return activeUsers().filter((user) => user.role !== "cliente" && canUserAccessBrand(user, brandId));
}

function workloadScoreForUser(userId, sourceOrders = workOrders) {
  const workload = teamWorkload(userId, sourceOrders);
  const dueSoon = workload.open.filter((order) => daysUntil(order.dueDate) <= 2).length;
  const urgent = workload.open.filter((order) => order.priority === "high").length;
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
      ? `${best.user.name} tiene ${best.workload.open.length} abiertas, ${best.workload.review.length} en revisión y ${best.workload.overdue.length} vencidas.`
      : "No hay responsables disponibles para esta marca; deja la OT en revisión de jefe.",
  };
}

function processStepIndex(order) {
  if (!order || order.status === "cancelled") return -1;
  const statusMap = {
    new: 1,
    in_progress: 2,
    in_review: 3,
    completed: 4,
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
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0],
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

function formatDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
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

function clsStatus(status) {
  if (status === "approved" || status === "completed" || status === "published") return "green";
  if (status === "client_review" || status === "internal_review") return "blue";
  if (status === "changes_requested") return "red";
  return "amber";
}

function render() {
  if (isSupabaseMode() && dataState.loading) {
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

  const allBrands = isAllBrandsScope();
  const brand = allBrands ? null : getBrand();
  document.documentElement.style.setProperty("--brand-color", allBrands ? "#2d2d2d" : brand.color);
  document.getElementById("app").innerHTML = `
    <div class="workspace">
      <aside class="sidebar">
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
          <div class="topbar-title">
            <h1>${getModuleMeta().label}</h1>
            <div class="topbar-subtitle">${getScopeSubtitle()}</div>
          </div>
          <div class="topbar-actions">
            <select class="brand-select topbar-brand-select js-brand-select" aria-label="Marca activa">
              ${renderBrandOptions(state.currentBrandId)}
            </select>
            <button class="button small topbar-create" data-action="open-create-work-order">+ Crear OT</button>
            <button class="button-ghost small" data-module="work-orders">OTs</button>
          <button class="button-ghost small" data-module="reports">Reportería</button>
          </div>
        </header>
        <div class="content">
          ${renderModule()}
        </div>
      </main>
    </div>
    ${state.toast ? `<div class="toast">${state.toast}</div>` : ""}
  `;
  bindEvents();
  focusLinkedWorkOrder();
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
    notifications: renderNotifications,
    productions: renderProductions,
    content: renderContent,
    assets: renderAssets,
    copywriting: renderCopywriting,
    creativity: renderCreativity,
    reports: renderReports,
    team: renderTeam,
    "client-portal": renderClientPortal,
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
          <span class="badge blue">${client.name}</span>
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
        <p class="muted">Un tablero ejecutivo para ver carga, responsables, vencimientos y avance sin entrar marca por marca.</p>
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
      <span class="muted">${getClient(brand.clientId).name}</span>
      <div class="mini-progress"><div style="width:${completion}%"></div></div>
      <div class="brand-mini-meta">
        <span>${open} OTs</span>
        <span>${review} rev.</span>
        <span>${overdue} venc.</span>
      </div>
    </button>
  `;
}

function dashboardScopedOrders() {
  return brandOrders(state.currentBrandId);
}

function dashboardScopedBrands() {
  return isAllBrandsScope() ? brands.filter((brand) => brand.isActive !== false) : [getBrand()];
}

function workOrderCriticalScore(order) {
  const days = daysUntil(order.dueDate);
  const overdueWeight = days < 0 ? Math.abs(days) * 12 : 0;
  const priorityWeight = order.priority === "high" ? 28 : order.priority === "medium" ? 8 : 0;
  const assigneeWeight = orderAssignees(order).length ? 0 : 24;
  const reviewWeight = order.status === "in_review" ? 18 : 0;
  return overdueWeight + priorityWeight + assigneeWeight + reviewWeight;
}

function criticalWorkOrders(sourceOrders = dashboardScopedOrders()) {
  return sourceOrders
    .filter((order) => {
      if (!isOpenWorkOrder(order)) return false;
      return daysUntil(order.dueDate) < 0 || order.priority === "high" || !orderAssignees(order).length || order.status === "in_review";
    })
    .sort((a, b) => workOrderCriticalScore(b) - workOrderCriticalScore(a) || daysUntil(a.dueDate) - daysUntil(b.dueDate));
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
      const urgent = brandOpen.filter((order) => order.priority === "high").length;
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

function renderKpiCard(label, value, detail, tone = "neutral") {
  return `
    <article class="kpi-card kpi-${tone}">
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
      ${detail ? `<small>${escapeHtml(detail)}</small>` : ""}
    </article>
  `;
}

function renderDashboardHeader() {
  return `
    <section class="dashboard-command">
      <div>
        <span class="eyebrow">Centro de mando</span>
        <h2>Dashboard operativo</h2>
        <p>Resumen de carga, vencimientos y prioridades del equipo.</p>
      </div>
      <div class="dashboard-command-actions">
        <select class="brand-select js-brand-select" aria-label="Marca o cliente">
          ${renderBrandOptions(state.currentBrandId)}
        </select>
        <button class="button" data-action="open-create-work-order">+ Crear OT</button>
        <button class="button-ghost" data-module="reports">Ver reportes</button>
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
  const assigneeNames = orderAssignees(order).map(userName).join(", ") || "Sin responsable";
  return `
    <article class="alert-card">
      <div class="alert-card-main">
        <div class="row between">
          <span class="badge">${escapeHtml(order.id)}</span>
          <span class="badge ${urgency.cls}">${escapeHtml(urgency.label)}</span>
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

  return `
    <section class="panel executive-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">Carga por responsable</h2>
          <div class="small-muted">Distribución de OTs abiertas y vencidas por persona.</div>
        </div>
      </div>
      <div class="compact-table executive-table">
        <table>
          <thead>
            <tr>
              <th>Responsable</th>
              <th>Abiertas</th>
              <th>Vencidas</th>
              <th>Revisión</th>
              <th>Carga</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    <td>
                      <strong>${escapeHtml(row.user.name)}</strong>
                      <div class="muted">${escapeHtml(roleLabels[row.user.role] || row.user.role)}</div>
                    </td>
                    <td>${row.open}</td>
                    <td><span class="${row.overdue ? "text-red" : ""}">${row.overdue}</span></td>
                    <td>${row.review}</td>
                    <td><span class="badge ${row.loadLevel.cls}">${row.loadLevel.label}</span></td>
                    <td><button class="button-ghost small" data-workorder-assignee-filter="${escapeHtml(row.user.id)}">Ver</button></td>
                  </tr>
                `,
              )
              .join("") || `<tr><td colspan="6"><div class="empty compact-empty">Sin responsables activos</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderRiskBrandsTable(sourceOrders = dashboardScopedOrders(), sourceBrands = dashboardScopedBrands()) {
  const rows = riskyBrandRows(sourceOrders, sourceBrands);
  return `
    <section class="panel executive-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">Marcas que necesitan seguimiento</h2>
          <div class="small-muted">Marcas con OTs vencidas, en revisión o sin responsable.</div>
        </div>
        <button class="button-ghost small" data-module="brands">Ver marcas</button>
      </div>
      <div class="compact-table executive-table">
        <table>
          <thead>
            <tr>
              <th>Marca</th>
              <th>Cliente</th>
              <th>Abiertas</th>
              <th>Vencidas</th>
              <th>Revisión</th>
              <th>Responsable</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    <td><strong>${escapeHtml(row.brand.shortName)}</strong></td>
                    <td>${escapeHtml(row.client?.name || "Cliente")}</td>
                    <td>${row.open}</td>
                    <td><span class="${row.overdue ? "text-red" : ""}">${row.overdue}</span></td>
                    <td>${row.review}</td>
                    <td>${escapeHtml(row.responsible)}</td>
                    <td><button class="button-ghost small" data-brand-jump="${escapeHtml(row.brand.id)}">Ver marca</button></td>
                  </tr>
                `,
              )
              .join("") || `<tr><td colspan="7"><div class="empty compact-empty">No hay marcas en riesgo en este scope.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderExecutiveDashboard() {
  const sourceOrders = dashboardScopedOrders();
  const sourceBrands = dashboardScopedBrands();
  const openOrders = sourceOrders.filter(isOpenWorkOrder);
  const overdueOrders = openOrders.filter((order) => daysUntil(order.dueDate) < 0);
  const reviewOrders = openOrders.filter((order) => order.status === "in_review");
  const unassignedOrders = openOrders.filter((order) => !orderAssignees(order).length);
  const criticalOrders = criticalWorkOrders(sourceOrders);

  return `
    ${renderDashboardHeader()}
    <section class="executive-kpis">
      ${renderKpiCard("OTs abiertas", openOrders.length, "Trabajo activo", "dark")}
      ${renderKpiCard("Vencidas", overdueOrders.length, "Necesitan acción", overdueOrders.length ? "danger" : "neutral")}
      ${renderKpiCard("En revisión", reviewOrders.length, "Validación interna", "warning")}
      ${renderKpiCard("Sin responsable", unassignedOrders.length, "Pendientes de asignar", unassignedOrders.length ? "danger" : "neutral")}
    </section>
    <section class="panel attention-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">Requiere atención</h2>
          <div class="small-muted">OTs vencidas, urgentes o bloqueadas que necesitan acción.</div>
        </div>
        ${criticalOrders.length > 5 ? `<button class="button-ghost small" data-workorder-quick-filter="critical">Ver todas las OTs críticas</button>` : ""}
      </div>
      <div class="attention-list">
        ${criticalOrders.slice(0, 5).map(renderAttentionCard).join("") || `<div class="empty compact-empty">Sin OTs críticas por ahora.</div>`}
      </div>
    </section>
    <section class="dashboard-executive-grid">
      ${renderDashboardWorkloadTable(sourceOrders)}
      ${renderRiskBrandsTable(sourceOrders, sourceBrands)}
    </section>
  `;
}

function renderAllBrandsDashboard() {
  return renderExecutiveDashboard();
}

function renderDashboardDeadlineCalendar(sourceOrders, title = "Calendario mensual de deadlines", scopeLabel = "") {
  const monthKey = state.dashboardMonth || monthKeyFromDate();
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sab", "Dom"];
  const cells = monthCalendarDays(monthKey);
  const monthOrders = sourceOrders
    .filter((order) => dateMatchesMonth(order.dueDate, monthKey))
    .sort((a, b) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")));
  const openMonthOrders = monthOrders.filter(isOpenWorkOrder);
  const overdueMonthOrders = openMonthOrders.filter((order) => daysUntil(order.dueDate) < 0);

  return `
    <section class="panel section dashboard-calendar-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">${title}</h2>
          <div class="small-muted">${scopeLabel || "Órdenes"} con deadline en el mes seleccionado.</div>
        </div>
        <div class="row wrap">
          <input class="input month-input" type="month" data-dashboard-month value="${escapeHtml(monthKey)}" />
          <span class="badge blue">${monthOrders.length} OTs</span>
          <span class="badge ${overdueMonthOrders.length ? "red" : "green"}">${overdueMonthOrders.length} vencidas</span>
        </div>
      </div>
      <div class="deadline-calendar-grid">
        ${days.map((day) => `<div class="deadline-calendar-head">${day}</div>`).join("")}
        ${cells
          .map((cell) => {
            const dayOrders = monthOrders.filter((order) => String(order.dueDate || "").slice(0, 10) === cell.iso);
            return `
              <div class="deadline-calendar-day ${cell.isCurrentMonth ? "" : "muted-month"} ${cell.isToday ? "today" : ""}">
                <div class="deadline-day-number">
                  <span>${cell.day}</span>
                  ${dayOrders.length ? `<strong>${dayOrders.length}</strong>` : ""}
                </div>
                <div class="deadline-day-items">
                  ${dayOrders
                    .slice(0, 4)
                    .map((order) => {
                      const urgency = workOrderUrgency(order);
                      const brand = getBrand(order.brandId);
                      return `
                        <button class="deadline-chip ${urgency.cls}" data-action="view-work-order" data-id="${order.id}">
                          <strong>${escapeHtml(order.id)}</strong>
                          <span>${escapeHtml(order.title)}</span>
                          <small>${escapeHtml(isAllBrandsScope() ? brand.shortName : orderAssignees(order).map(userName).join(", ") || "Sin asignar")}</small>
                        </button>
                      `;
                    })
                    .join("")}
                  ${dayOrders.length > 4 ? `<span class="deadline-more">+${dayOrders.length - 4} mas</span>` : ""}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderCalendarWorkspace() {
  const orders = brandOrders();
  const openOrders = orders.filter(isOpenWorkOrder);
  return `
    <section class="section">
      <section class="panel brand-hero calendar-hero">
        <div>
          <div class="hero-title">
            <h2>Calendario</h2>
            <span class="badge blue">${isAllBrandsScope() ? "Vista global" : getBrand().shortName}</span>
          </div>
          <p class="muted">Fechas de entrega y agenda mensual de OTs sin saturar el Dashboard ejecutivo.</p>
        </div>
        <div class="quick-links">
          <button class="button" data-action="open-create-work-order">+ Crear OT</button>
          <button class="button-ghost" data-module="work-orders">Ver lista de OTs</button>
        </div>
      </section>
      <div class="segmented calendar-tabs" aria-label="Vistas de calendario">
        <button class="active" type="button">Mes</button>
        <button type="button">Semana</button>
        <button type="button">Lista</button>
      </div>
      ${renderDashboardDeadlineCalendar(orders, "Calendario mensual de deadlines", isAllBrandsScope() ? "OTs de todas las marcas" : getBrand().shortName)}
      ${renderWorkOrderMonthTimeline(openOrders)}
    </section>
  `;
}

function renderBrandsWorkspace() {
  const snapshots = brands.map(getBrandSnapshot);
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
          <button class="button" data-action="open-create-work-order">+ Crear OT</button>
          <button class="button-ghost" data-module="dashboard">Volver al dashboard</button>
        </div>
      </section>
      <div class="client-lanes brands-client-lanes">
        ${clients
          .map((clientItem) => {
            const clientSnapshots = snapshots.filter((snapshot) => snapshot.brand.clientId === clientItem.id);
            const clientOpen = clientSnapshots.reduce((sum, snapshot) => sum + snapshot.open, 0);
            const clientOverdue = clientSnapshots.reduce((sum, snapshot) => sum + snapshot.overdue, 0);
            const clientReview = clientSnapshots.reduce((sum, snapshot) => sum + snapshot.review, 0);
            return `
              <article class="client-lane navigation-card">
                <div class="client-lane-head">
                  <div>
                    <strong>${escapeHtml(clientItem.name)}</strong>
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
    </section>
  `;
}

function renderDashboard() {
  return renderExecutiveDashboard();
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
        ${rows
          .map(
            ({ user, open, overdue, review, collaborators, next }) => `
              <div class="digest-row">
                <div>
                  <strong>${user.name}</strong>
                  <div class="muted">${roleLabels[user.role] || user.role}</div>
                </div>
                <div class="digest-stats">
                  <span class="badge ${overdue > 0 ? "red" : "green"}">${overdue} vencidas</span>
                  <span class="badge blue">${open} abiertas</span>
                  <span class="badge amber">${review} rev.</span>
                  <span class="badge purple">${collaborators} colab.</span>
                </div>
                <div class="digest-next">${next ? `${next.id} / ${formatDate(next.dueDate)}` : "Sin pendientes"}</div>
              </div>
            `,
          )
          .join("")}
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
        <span>Resumen por correo para Dirección/Cuentas con la carga de trabajo del equipo.</span>
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
      ${renderWorkOrderAiComposer(true)}
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

function renderWorkOrderSmartPanel(orders, allBrands) {
  const urgentOrders = orders
    .filter((order) => isOpenWorkOrder(order) && (order.priority === "high" || daysUntil(order.dueDate) <= 1))
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate))
    .slice(0, 4);
  const smartBrand = allBrands ? "" : getBrand().shortName;

  return `
    <section class="smart-work-order-panel">
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
    ${clients
      .map(
        (clientItem) => `
          <optgroup label="${escapeHtml(clientItem.name)}">
            ${brands
              .filter((brandItem) => brandItem.clientId === clientItem.id)
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

function renderWorkOrderMonthTimeline(orders) {
  const monthKey = state.workOrderMonth || monthKeyFromDate();
  const monthOrders = orders
    .filter((order) => dateMatchesMonth(order.dueDate, monthKey))
    .sort((a, b) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")));
  const grouped = monthOrders.reduce((acc, order) => {
    const day = String(order.dueDate || "").slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(order);
    return acc;
  }, {});
  const days = Object.keys(grouped).sort();

  return `
    <section class="panel section work-order-timetable">
      <div class="section-header">
        <div>
          <h2 class="section-title">Timetable del mes</h2>
          <div class="small-muted">Órdenes con deadline dentro del mes seleccionado.</div>
        </div>
        <div class="row wrap">
          <input class="input month-input" type="month" data-work-order-month value="${escapeHtml(monthKey)}" />
          <span class="badge blue">${monthOrders.length} OTs</span>
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
                            (order) => `
                              <button class="timeline-item" data-action="view-work-order" data-id="${order.id}">
                                <span>${escapeHtml(order.id)}</span>
                                <strong>${escapeHtml(order.title)}</strong>
                                <small>${escapeHtml(orderAssignees(order).map(userName).join(", ") || "Sin asignar")}</small>
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
  return workOrders.find((order) => order.id === state.editingWorkOrderId) || null;
}

function selectedViewingOrder() {
  return workOrders.find((order) => order.id === state.viewingWorkOrderId) || null;
}

function renderWorkOrderSelectOption(value, label, activeValue) {
  return `<option value="${value}" ${value === activeValue ? "selected" : ""}>${label}</option>`;
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
  return users.filter(
    (user) =>
      user.role !== "cliente" &&
      (user.isActive !== false || selectedAssignees.has(user.id)) &&
      canUserAccessBrand(user, state.currentBrandId),
  );
}

function normalizeAiText(value = "") {
  return plainText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
  const title = cleanPrompt
    ? `${categoryLabel} - ${brand.shortName}`
    : `Nueva ${categoryLabel.toLowerCase()} para ${brand.shortName}`;
  return {
    title,
    category,
    priority,
    dueDate,
    description: cleanPrompt || `Solicitud de ${categoryLabel.toLowerCase()} para ${brand.shortName}.`,
    subtasks: workOrderAiSubtasks(category),
    materialChanges: workOrderAiMaterialChanges(category, cleanPrompt),
    assignees: Array.from(new Set([...(mentionedAssignees.length ? mentionedAssignees : []), ...workOrderAiAssignees(category, availableUsers)])).slice(0, 4),
  };
}

function renderWorkOrderAiAssistant(isEditing) {
  return `
    <div class="ai-order-assistant">
      <div>
        <span class="badge green">IA de OTs</span>
        <h3>Asistente de creación</h3>
        <p class="muted">Describe la orden y a quién va dirigida; el sistema arma título, categoría, deadline, subtareas y responsables sugeridos.</p>
      </div>
      <textarea class="textarea compact-textarea" id="ot-ai-brief" placeholder="Ej: matriz de contenido de julio para Danone, para generador y creativo, deadline 25/05/2026, incluir formatos para reels y carruseles"></textarea>
      <div class="row wrap">
        <button class="button small" data-action="fill-work-order-ai">${isEditing ? "Actualizar borrador" : "Armar borrador"}</button>
        <span class="small-muted">Luego revisas y guardas manualmente la OT.</span>
      </div>
    </div>
  `;
}

function renderSupervisorGatePanelContent(category = "diseno", brandId = state.currentBrandId) {
  const area = workOrderProcessArea(category);
  const needsGate = requiresSupervisorGate(category);
  const supervisors = supervisorCandidates(category, brandId).slice(0, 4);
  return `
    <div class="gate-panel ${needsGate ? "active" : ""}">
      <div class="gate-icon">${needsGate ? "JD" : "OK"}</div>
      <div>
        <strong>${needsGate ? "Primero revisa jefe inmediato" : "Flujo directo"}</strong>
        <p class="muted">
          ${
            needsGate
              ? `${area.label}: la OT se manda primero a jefe/dirección para asignar responsable final y confirmar deadline.`
              : `${area.label}: puede asignarse directo al equipo responsable.`
          }
        </p>
        <div class="badge-row">
          ${
            supervisors.length
              ? supervisors.map((user) => `<span class="badge ${needsGate ? "amber" : "green"}">${escapeHtml(user.name)} · ${escapeHtml(roleLabels[user.role] || user.role)}</span>`).join("")
              : `<span class="badge amber">Sin jefe configurado para esta marca</span>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderSupervisorGatePanel(category = "diseno") {
  return `<div id="supervisor-gate-panel">${renderSupervisorGatePanelContent(category)}</div>`;
}

function renderUrgentPlannerPanel(category = "diseno", priority = "medium") {
  const plan = urgentWorkOrderPlan({ category, priority });
  return `
    <div class="urgent-planner-panel">
      <div>
        <span class="badge red">Urgencias</span>
        <h3>Planificador de carga</h3>
        <p class="muted">Si esta solicitud entra urgente, Lumen compara carga abierta, vencidas y revisión para sugerir persona y deadline.</p>
      </div>
      <div class="urgent-plan-preview" id="urgent-plan-preview">
        <strong>${plan.candidate ? escapeHtml(plan.candidate.name) : "Pendiente de asignar"}</strong>
        <span>${escapeHtml(plan.reason)}</span>
        <span class="badge ${priority === "high" ? "red" : "blue"}">Fecha sugerida: ${escapeHtml(formatDate(plan.dueDate))}</span>
      </div>
      <button class="button-ghost small" data-action="optimize-work-order-urgency">Aplicar sugerencia urgente</button>
    </div>
  `;
}

function renderWorkOrderProcessTimeline(order) {
  const area = workOrderProcessArea(order.category);
  const activeIndex = processStepIndex(order);
  return `
    <div class="process-timeline-card">
      <div class="section-header compact">
        <div>
          <h3 class="section-title">Timeline del proceso</h3>
          <div class="small-muted">${escapeHtml(area.label)} segun procesos Lumen.</div>
        </div>
        <span class="badge blue">${escapeHtml(workOrderStatusLabels[order.status] || order.status)}</span>
      </div>
      <div class="process-timeline">
        ${area.steps
          .map(([title, detail], index) => {
            const stateClass = activeIndex < 0 ? "blocked" : index < activeIndex ? "done" : index === activeIndex ? "active" : "";
            return `
              <div class="process-step ${stateClass}">
                <span class="process-step-index">${index + 1}</span>
                <div>
                  <strong>${escapeHtml(title)}</strong>
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

function renderUrgentOrderBanner(order) {
  const days = daysUntil(order.dueDate);
  const shouldShow = order.priority === "high" || days <= 1 || days < 0;
  if (!shouldShow || isArchivedWorkOrder(order) || !isOpenWorkOrder(order)) return "";
  const plan = urgentWorkOrderPlan({ category: order.category, brandId: order.brandId, priority: "high" });
  return `
    <div class="urgent-order-banner">
      <div>
        <span class="badge red">Alerta visible</span>
        <h3>Esta OT necesita decision rapida</h3>
        <p>
          ${escapeHtml(plan.reason)}
          ${plan.candidate ? ` Fecha ideal sugerida: ${escapeHtml(formatDate(plan.dueDate))}.` : ""}
        </p>
      </div>
      <div class="row wrap">
        ${plan.candidate ? `<span class="badge">${escapeHtml(plan.candidate.name)} · ${escapeHtml(workloadLabelForUser(plan.candidate.id))}</span>` : ""}
        ${canManageWorkOrders() ? `<button class="button-danger small" data-action="apply-urgent-workload-plan" data-id="${order.id}">Aplicar plan sugerido</button>` : ""}
        ${canManageWorkOrders() ? `<button class="button small" data-action="send-urgent-alert" data-id="${order.id}">Enviar alerta a jefes</button>` : ""}
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
          ${isEditing ? "Para editar, avanzar o adjuntar archivos a una OT necesitas rol Admin, Dirección o Cuentas." : "Para crear una OT necesitas rol Admin, Dirección, Cuentas, Generador o Creativo."}
        </div>
      </div>
    `;
  }
  const selectedAssignees = new Set(isEditing ? orderAssignees(order) : []);
  const parsedDescription = splitWorkOrderDescription(order?.description || "");
  const availableUsers = availableWorkOrderAssigneeUsers(selectedAssignees);
  const selectedUsers = availableUsers.filter((user) => selectedAssignees.has(user.id));
  const files = isEditing ? orderFiles(order) : [];
  const titleValue = isEditing ? order.title : `Nueva solicitud para ${getBrand().shortName}`;
  const descriptionValue = isEditing
    ? parsedDescription.description || ""
    : "Contexto, entregable esperado y criterios de aprobación.";
  const subtasksValue = parsedDescription.subtasks.join("\n");
  const materialChangesValue = parsedDescription.materialChanges.join("\n");
  const dueDateValue = isEditing ? order.dueDate || "" : "2026-05-08";
  const priorityValue = isEditing ? order.priority : "medium";
  const statusValue = isEditing ? order.status : "new";
  const categoryValue = isEditing ? order.category : "diseno";
  const notifyOnEmail = isEditing ? order.notifyOnEmail !== false : true;

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
      ${renderWorkOrderAiAssistant(isEditing)}
      ${renderSupervisorGatePanel(categoryValue)}
      ${renderUrgentPlannerPanel(categoryValue, priorityValue)}
      <div class="form-grid">
        <div class="field full">
          <label>Titulo</label>
          <input class="input" id="ot-title" value="${escapeHtml(titleValue)}" />
        </div>
        <div class="field">
          <label>Responsables</label>
          <div class="assignee-picker">
            <input class="input assignee-search" id="ot-assignee-search" placeholder="Buscar responsable..." />
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
                    const isSupervisor = supervisorCandidates(categoryValue, state.currentBrandId).some((candidate) => candidate.id === user.id);
                    return `
                    <label class="assignee-option" data-assignee-option="${escapeHtml(`${user.name} ${user.email} ${roleLabels[user.role] || user.role}`.toLowerCase())}">
                      <input type="checkbox" data-ot-assignee value="${user.id}" ${selectedAssignees.has(user.id) ? "checked" : ""} />
                      <span>
                        <strong>${escapeHtml(user.name)}</strong>
                        <small>${escapeHtml(roleLabels[user.role] || user.role)} · ${escapeHtml(userLoad)}</small>
                        <em>${escapeHtml(user.email)}</em>
                      </span>
                      ${isSupervisor ? `<small class="assignee-tag">Jefe</small>` : ""}
                    </label>
                  `;
                  },
                )
                .join("") || `<div class="empty compact-empty">No hay responsables disponibles para esta marca</div>`}
            </div>
          </div>
          <div class="field-help">Marca una o varias personas. El buscador filtra por nombre, correo o rol.</div>
        </div>
        <div class="field">
          <label>Deadline</label>
          <input class="input" id="ot-due-date" type="date" value="${escapeHtml(dueDateValue)}" />
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
          <select class="input" id="ot-status">
            ${renderWorkOrderStatusOptions(statusValue)}
          </select>
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
            Notificar por email a responsables
          </label>
          <button class="button" data-action="${isEditing ? "update-work-order" : "create-work-order"}">
            ${isEditing ? "Guardar cambios" : "Crear OT"}
          </button>
          ${isEditing ? `<button class="button-ghost" data-action="cancel-edit-work-order">Cancelar</button>` : ""}
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
  const canManage = canManageWorkOrders();
  const canUploadMaterials = canUploadWorkOrderMaterials(order);
  const archived = isArchivedWorkOrder(order);

  return `
    <section class="panel section work-order-detail-panel" data-order-detail="${escapeHtml(order.id)}">
      <div class="section-header">
        <div>
          <div class="row wrap">
            <span class="badge">${escapeHtml(order.id)}</span>
            <span class="badge ${urgency.cls}">${escapeHtml(urgency.label)}</span>
            <span class="badge ${order.priority === "high" ? "red" : order.priority === "medium" ? "amber" : "green"}">${escapeHtml(workOrderPriorityLabels[order.priority] || order.priority)}</span>
          </div>
          <h2 class="section-title">${escapeHtml(order.title)}</h2>
          <div class="small-muted">${escapeHtml(client?.name || "Cliente")} / ${escapeHtml(brand.shortName)} / deadline ${escapeHtml(formatDate(order.dueDate))}</div>
        </div>
        <div class="row wrap">
          ${canManage ? `<button class="button-ghost small" data-action="edit-work-order" data-id="${order.id}">Editar</button>` : ""}
          ${
            canManage
              ? archived
                ? `<button class="button-ghost small" data-action="unarchive-work-order" data-id="${order.id}">Restaurar</button>`
                : `<button class="button-danger small" data-action="archive-work-order" data-id="${order.id}">Archivar</button>`
              : ""
          }
          <button class="button-ghost small" data-action="close-work-order-detail">Cerrar</button>
        </div>
      </div>
      ${renderUrgentOrderBanner(order)}
      ${canManage && !archived ? renderWorkOrderStageControl(order) : ""}
      ${renderWorkOrderProcessTimeline(order)}
      <div class="work-order-detail-grid">
        <div class="detail-block">
          <span>Estado</span>
          <strong>${archived ? "Archivada" : escapeHtml(workOrderStatusLabels[order.status] || order.status)}</strong>
        </div>
        <div class="detail-block">
          <span>Categoria</span>
          <strong>${escapeHtml(workOrderCategoryLabels[order.category] || order.category)}</strong>
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
      </div>
      <div class="grid grid-2 top-aligned-grid">
        <div class="detail-readable-block">
          <h3>Brief</h3>
          <p>${escapeHtml(parsedDescription.description || "Sin descripcion")}</p>
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
                    ? `<ul class="subtask-list">${parsedDescription.subtasks.map((task) => `<li>${escapeHtml(task)}</li>`).join("")}</ul>`
                    : `<span class="muted">Sin subtareas</span>`
                }
              </div>
              <div class="detail-readable-block">
                <h3>Cambios en materiales</h3>
                ${
                  parsedDescription.materialChanges.length
                    ? `<ul class="subtask-list">${parsedDescription.materialChanges.map((change) => `<li>${escapeHtml(change)}</li>`).join("")}</ul>`
                    : `<span class="muted">Sin cambios registrados</span>`
                }
              </div>
            </div>
          `
          : ""
      }
    </section>
  `;
}

function renderWorkOrders() {
  const allScopeOrders = brandOrders(state.currentBrandId, { includeArchived: true });
  const archivedOrders = allScopeOrders.filter(isArchivedWorkOrder);
  const activeScopeOrders = state.showArchivedWorkOrders ? archivedOrders : allScopeOrders.filter((order) => !isArchivedWorkOrder(order));
  const orders = filterWorkOrdersForPanel(activeScopeOrders);
  const openOrders = orders.filter(isOpenWorkOrder);
  const overdueOrders = openOrders.filter((order) => daysUntil(order.dueDate) < 0);
  const allBrands = isAllBrandsScope();
  const detailPanel = renderWorkOrderDetailPanel(selectedViewingOrder());
  const setupSection = renderWorkOrderSetupSection(allBrands);
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
    ${detailPanel}
    ${operationsPanel}
    ${setupSection}
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
  const dueDays = daysUntil(order.dueDate);
  const hasAssignee = orderAssignees(order).length > 0;
  if (filter === "critical") return criticalWorkOrders([order]).length > 0;
  if (filter === "overdue") return isOpenWorkOrder(order) && dueDays < 0;
  if (filter === "today") return isOpenWorkOrder(order) && dueDays === 0;
  if (filter === "week") return isOpenWorkOrder(order) && dueDays >= 0 && dueDays <= 7;
  if (filter === "unassigned") return isOpenWorkOrder(order) && !hasAssignee;
  if (filter === "review") return order.status === "in_review";
  if (filter === "high") return order.priority === "high";
  return true;
}

function filterWorkOrdersForPanel(orders) {
  const filters = state.workOrderFilters || {};
  return orders.filter((order) => {
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
    <section class="panel section work-order-filter-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">Filtros de seguimiento</h2>
          <div class="small-muted">Encuentra rápido OTs vencidas, sin responsable, en revisión o de alta prioridad.</div>
        </div>
        <button class="button-ghost small" data-action="clear-work-order-filters">Limpiar filtros</button>
      </div>
      <div class="form-grid work-order-filter-grid">
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
            <option value="overdue" ${filters.quick === "overdue" ? "selected" : ""}>Vencidas</option>
            <option value="today" ${filters.quick === "today" ? "selected" : ""}>Hoy</option>
            <option value="week" ${filters.quick === "week" ? "selected" : ""}>Esta semana</option>
          </select>
        </div>
      </div>
      <div class="quick-chip-row">
        ${renderQuickFilterChip("overdue", "Vencidas")}
        ${renderQuickFilterChip("today", "Hoy")}
        ${renderQuickFilterChip("week", "Esta semana")}
        ${renderQuickFilterChip("unassigned", "Sin responsable")}
        ${renderQuickFilterChip("review", "En revisión")}
        ${renderQuickFilterChip("high", "Alta prioridad")}
      </div>
    </section>
  `;
}

function renderWorkOrderOperationsPanel(orders, allBrands, archivedCount = 0) {
  const sortedOrders = orders
    .slice()
    .sort((a, b) => {
      const openDiff = Number(isOpenWorkOrder(b)) - Number(isOpenWorkOrder(a));
      if (openDiff) return openDiff;
      return daysUntil(a.dueDate) - daysUntil(b.dueDate);
    });
  const statusRows = Object.entries(workOrderEditableStatusLabels).map(([status, label]) => ({
    status,
    label,
    count: orders.filter((order) => order.status === status).length,
  }));

  return `
    <section class="panel section operations-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title">${state.showArchivedWorkOrders ? "OTs archivadas" : "Lista operativa de OTs"}</h2>
          <div class="small-muted">${state.showArchivedWorkOrders ? "Órdenes fuera del flujo activo. Puedes restaurarlas cuando vuelvan a moverse." : "Gestiona estado, responsable, fechas, archivos y seguimiento desde una sola lista."}</div>
        </div>
        <div class="row wrap">
          <button class="button-ghost small" data-action="toggle-archived-work-orders">
            ${state.showArchivedWorkOrders ? "Ocultar archivadas" : `Ver archivadas (${archivedCount})`}
          </button>
          <button class="button-ghost small" data-module="team">Ver carga equipo</button>
          <button class="button-ghost small" data-module="notifications">Reglas email</button>
        </div>
      </div>
      <div class="status-summary-strip">
        ${statusRows
          .map(
            (row) => `
              <div class="status-summary-card status-${row.status}">
                <strong>${row.count}</strong>
                <span>${row.label}</span>
              </div>
            `,
          )
          .join("")}
        <div class="status-summary-card status-archived">
          <strong>${archivedCount}</strong>
          <span>Archivadas</span>
        </div>
      </div>
      <div class="operations-list">
        ${
          sortedOrders.length
            ? sortedOrders.map((order) => renderOperationOrderRow(order, allBrands)).join("")
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
  const brand = getBrand(order.brandId);
  const canManage = canManageWorkOrders();
  const archived = isArchivedWorkOrder(order);
  return `
    <article class="operation-order-row ${order.id === state.focusedWorkOrderId ? "focused-row" : ""} ${archived ? "archived-row" : ""}">
      <button class="operation-order-main" data-action="view-work-order" data-id="${order.id}">
        <span class="status-dot ${urgency.cls}"></span>
        <span>
          <strong>${escapeHtml(order.id)} / ${escapeHtml(order.title)}</strong>
          <small>${escapeHtml(allBrands ? `${getClient(brand.clientId)?.name || "Cliente"} / ${brand.shortName}` : workOrderCategoryLabels[order.category] || order.category)}</small>
        </span>
      </button>
      <div class="operation-meta">
        <span class="badge ${urgency.cls}">${escapeHtml(urgency.label)}</span>
        <span class="muted">${escapeHtml(formatDate(order.dueDate))}</span>
      </div>
      <div class="operation-assignees">
        ${assignees.slice(0, 3).map((userId) => `<span class="avatar-pill">${escapeHtml(userName(userId))}</span>`).join("") || `<span class="muted">Sin asignar</span>`}
        ${assignees.length > 3 ? `<span class="badge">+${assignees.length - 3}</span>` : ""}
      </div>
      <div class="operation-files">
        <span class="badge">${files.length} archivo${files.length === 1 ? "" : "s"}</span>
      </div>
      <div class="operation-status-control">
        ${
          canManage
            ? `
              ${
                archived
                  ? `<button class="button small" data-action="unarchive-work-order" data-id="${order.id}">Restaurar</button>`
                  : `
                    ${renderWorkOrderStatusSelect(order)}
                    <button class="button small" data-action="update-order-status" data-id="${order.id}">Guardar</button>
                    <button class="button-ghost small archive-secondary-action" data-action="archive-work-order" data-id="${order.id}" title="Mover fuera del panel activo">Más: archivar</button>
                  `
              }
            `
            : `<span class="badge blue">${archived ? "Archivada" : escapeHtml(workOrderStatusLabels[order.status] || order.status)}</span>`
        }
      </div>
    </article>
  `;
}

function renderOrderCard(order) {
  const assignees = orderAssignees(order);
  const files = orderFiles(order);
  const urgency = workOrderUrgency(order);
  const isFocused = order.id === state.focusedWorkOrderId;
  const canManage = canManageWorkOrders();
  const canUploadMaterials = canUploadWorkOrderMaterials(order);
  const archived = isArchivedWorkOrder(order);
  const nextStatus = archived ? null : nextWorkOrderStatus(order);
  const parsedDescription = splitWorkOrderDescription(order.description || "");
  return `
    <div class="mini-card ${isFocused ? "focused-card" : ""}" data-order-card="${escapeHtml(order.id)}">
      <div class="row between">
        <span class="badge">${order.id}</span>
        <span class="badge ${order.priority === "high" ? "red" : order.priority === "medium" ? "amber" : "green"}">${workOrderPriorityLabels[order.priority] || order.priority}</span>
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
        ${
          canManage
            ? `
              <button class="button-ghost small" data-action="edit-work-order" data-id="${order.id}">Editar</button>
              ${
                nextStatus
                  ? `<button class="button-ghost small" data-action="advance-order" data-id="${order.id}">Avanzar a ${workOrderStatusLabels[nextStatus]}</button>`
                  : ""
              }
              ${
                archived
                  ? `<button class="button-ghost small" data-action="unarchive-work-order" data-id="${order.id}">Restaurar</button>`
                  : `<button class="button-ghost small" data-action="archive-work-order" data-id="${order.id}">Archivar</button>`
              }
              <button class="button-danger small" data-action="send-urgent-alert" data-id="${order.id}">Alerta urgente</button>
            `
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
        <p>Gestiona estados, responsables, fechas y seguimiento de cada OT.</p>
      </div>
      <div class="dashboard-command-actions">
        <select class="brand-select js-brand-select" aria-label="Cliente o marca">
          ${renderBrandOptions(state.currentBrandId)}
        </select>
        <button class="button" data-action="open-create-work-order">+ Crear OT</button>
        <button class="button-ghost" data-module="calendar">Ver calendario</button>
      </div>
    </section>
  `;
}

function renderNotifications() {
  const openOrders = workOrders.filter(isOpenWorkOrder);
  const overdueOrders = openOrders.filter((order) => daysUntil(order.dueDate) < 0);
  const dueTomorrow = openOrders.filter((order) => daysUntil(order.dueDate) === 1);
  return `
    <section class="section">
      <div class="panel brand-hero">
        <div>
          <div class="hero-title">
            <h2>Notificaciones de OTs</h2>
            <span class="badge blue">Correo operativo</span>
          </div>
          <p class="muted">Correos automaticos para asignaciones, vencimientos y resumen semanal del equipo.</p>
        </div>
        <div class="quick-links">
          <button class="button" data-action="run-weekly-digest-now">Preparar y enviar ahora</button>
          <button class="button-ghost" data-action="send-email-queue">Enviar pendientes</button>
          <button class="button-ghost" data-module="work-orders">Ver OTs</button>
        </div>
      </div>
      <section class="grid grid-4">
        ${renderMetric("OTs monitoreadas", openOrders.length, "Abiertas en todas las marcas")}
        ${renderMetric("Vencidas", overdueOrders.length, "Incluidas como alerta roja")}
        ${renderMetric("Vencen mañana", dueTomorrow.length, "Recordatorio 24h")}
        ${renderMetric("Destinatarios", internalUsers().length, "Equipo interno")}
      </section>
      <section class="grid grid-2 notifications-detail-grid">
        <div class="panel section">
          <div class="section-header">
            <h2 class="section-title">Reglas activas</h2>
            <span class="badge green">Automatizable</span>
          </div>
          <div class="stack">
            ${notificationRules
              .map(
                (rule) => `
                  <div class="notification-rule">
                    <div>
                      <strong>${rule.title}</strong>
                      <div class="muted">${rule.channel} / ${rule.recipients}</div>
                    </div>
                    <span class="badge ${rule.enabled ? "green" : "amber"}">${rule.enabled ? "Activo" : "Pausado"}</span>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
        <div class="panel section">
          <div class="section-header">
            <h2 class="section-title">Resumen del lunes</h2>
            <div class="row wrap">
              <button class="button-ghost small" data-action="queue-weekly-digest">Preparar sin enviar</button>
              <button class="button-ghost small" data-action="preview-weekly-digest">Ver resumen</button>
            </div>
          </div>
          <div class="small-muted">Preparar sin enviar solo deja los correos listos; no salen hasta tocar "Enviar pendientes".</div>
          ${renderWeeklyDigestPreview()}
        </div>
      </section>
      <section class="panel section notification-guide">
        <div class="section-header">
          <div>
            <h2 class="section-title">Como funcionan las notificaciones</h2>
            <div class="small-muted">Una guia rapida para entender que hace cada boton sin tocar configuraciones tecnicas.</div>
          </div>
          <span class="badge green">Brevo conectado</span>
        </div>
        <div class="notification-guide-grid">
          <div class="mini-card">
            <strong>1. Se prepara el aviso</strong>
            <span class="muted">Cuando una OT tiene email activo, Lumen crea el correo para los responsables.</span>
          </div>
          <div class="mini-card">
            <strong>2. Queda pendiente</strong>
            <span class="muted">El mensaje se guarda como pendiente para poder revisarlo o enviarlo en lote.</span>
          </div>
          <div class="mini-card">
            <strong>3. Se envia por Brevo</strong>
            <span class="muted">El boton Enviar pendientes manda los correos listos al equipo interno.</span>
          </div>
          <div class="mini-card">
            <strong>4. Resumen semanal</strong>
            <span class="muted">Cada persona interna recibe sus OTs asignadas todos los lunes, con foco semanal y mensual.</span>
          </div>
          <div class="mini-card">
            <strong>5. Cambios y subtareas</strong>
            <span class="muted">Al editar responsables, brief, subtareas, estado o materiales, los responsables reciben aviso por correo.</span>
          </div>
          <div class="mini-card">
            <strong>6. Matriz mensual</strong>
            <span class="muted">El 25 se crean OTs para la matriz de contenido del mes objetivo, excepto Proyectos, Pitch y Constructivos.</span>
            <button class="button-ghost small" data-action="run-monthly-content-matrix">Probar matrices</button>
          </div>
          <div class="mini-card">
            <strong>7. Colocacion de pauta</strong>
            <span class="muted">Se crean OTs de pauta para marcas activas, excepto Constructivos, Lumen, Proyectos y Pitch.</span>
            <button class="button-ghost small" data-action="run-monthly-paid-placement">Probar pauta</button>
          </div>
        </div>
        <div class="admin-note">
          Solo Admin, Dirección y Cuentas pueden disparar correos o automatizaciones desde la app. Las llaves privadas viven en Supabase, nunca en el navegador.
        </div>
      </section>
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
  return clients
    .map((clientItem) => {
      const clientBrands = scopedBrands.filter((brand) => brand.clientId === clientItem.id);
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
      title: `Carga alta: ${overloaded.map((row) => row.user.name.split(" ")[0]).join(", ")}`,
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
        <h2>Carga por responsable</h2>
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

  return `
    <section class="section">
      <div class="panel brand-hero reports-hero">
        <div>
          <div class="hero-title">
          <h2>Reportería operativa</h2>
            <span class="badge green">Agencia en tiempo real</span>
          </div>
          <p class="muted">Panorama de carga, entregas, atrasos y trabajo activo por cliente, marca y responsable.</p>
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
            <div class="small-muted">Analiza la carga y entregas por mes o por rango de fechas.</div>
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

      <section class="grid grid-2 top-aligned-grid">
        <div class="panel section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Clientes y cumplimiento</h2>
              <div class="small-muted">Que tanto trabajo se esta haciendo y donde se estan atrasando las entregas.</div>
            </div>
            <span class="badge blue">${clientRows.length} clientes</span>
          </div>
          <div class="compact-table">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Abiertas</th>
                  <th>Entregadas</th>
                  <th>Fuera de fecha</th>
                  <th>A tiempo</th>
                </tr>
              </thead>
              <tbody>
                ${clientRows
                  .map(
                    (row) => `
                      <tr>
                        <td>
                          <strong>${row.client.name}</strong>
                          <div class="muted">${row.brands} marcas / ${row.total} OTs</div>
                        </td>
                        <td>${row.open}</td>
                        <td>${row.completed}</td>
                        <td><span class="badge ${row.lateCompleted || row.overdueOpen ? "red" : "green"}">${row.lateCompleted} cerradas / ${row.overdueOpen} abiertas</span></td>
                        <td>${row.onTime === null ? "N/A" : `${row.onTime}%`}</td>
                      </tr>
                    `,
                  )
                  .join("") || `<tr><td colspan="5"><div class="empty compact-empty">Sin OTs para reportar</div></td></tr>`}
              </tbody>
            </table>
          </div>
        </div>

        <div class="panel section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Carga por responsable</h2>
              <div class="small-muted">Todas las personas internas activas, no solo quienes tienen OTs.</div>
            </div>
            <span class="badge amber">${openOrders.length} abiertas</span>
          </div>
          <div class="team-workload-list report-workload-list">
            ${teamRows
              .map(
                ({ user, open, overdue, review, load }) => `
                  <div class="team-mini-row report-team-row">
                    <div>
                      <strong>${user.name}</strong>
                      <span class="muted">${roleLabels[user.role] || user.role} / ${open} abiertas / ${review} rev. / ${overdue} venc.</span>
                    </div>
                    <div class="bar-track"><div class="bar-fill ${overdue ? "danger-fill" : ""}" style="width:${load}%"></div></div>
                  </div>
                `,
              )
              .join("") || `<div class="empty compact-empty">Sin equipo interno activo</div>`}
          </div>
        </div>
      </section>

      <section class="grid grid-2 top-aligned-grid">
        <div class="panel section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Carga por marca</h2>
              <div class="small-muted">Vista rápida para entrar a la marca que necesita seguimiento.</div>
            </div>
            <span class="badge">${brandRows.length} marcas</span>
          </div>
          <div class="brand-report-list">
            ${brandRows
              .map(
                (row) => `
                  <button class="brand-report-row" data-brand-jump="${row.brand.id}">
                    <div>
                      <strong>${row.brand.shortName}</strong>
                      <span>${row.client?.name || "Cliente"} / ${row.total} OTs</span>
                    </div>
                    <div class="report-row-metrics">
                      <span>${row.open} abiertas</span>
                      <span>${row.completed} entregadas</span>
                      <span class="${row.overdueOpen || row.lateCompleted ? "text-red" : ""}">${row.overdueOpen + row.lateCompleted} riesgos</span>
                    </div>
                    <div class="mini-progress"><div style="width:${row.completion}%"></div></div>
                  </button>
                `,
              )
              .join("") || `<div class="empty compact-empty">Sin marcas para reportar</div>`}
          </div>
        </div>

        <div class="panel section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Carga por tipo de entregable</h2>
              <div class="small-muted">Qué se está moviendo: diseño, copy, pauta, producción y más.</div>
            </div>
            <span class="badge blue">${categoryRows.length} categorías</span>
          </div>
          <div class="bar-chart">
            ${categoryRows
              .map(
                (row) => `
                  <div class="bar-row report-bar-row">
                    <span>${row.label}</span>
                    <div class="bar-track"><div class="bar-fill" style="width:${Math.max(8, percent(row.total, maxCategory))}%"></div></div>
                    <strong>${row.total}</strong>
                    <small>${row.open} abiertas / ${row.completed} entregadas</small>
                  </div>
                `,
              )
              .join("") || `<div class="empty compact-empty">Aún no hay categorías con OTs</div>`}
          </div>
        </div>
      </section>

      <section class="grid grid-2 top-aligned-grid">
        <div class="panel section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Qué revisar primero</h2>
              <div class="small-muted">Lectura accionable para decidir qué revisar primero.</div>
            </div>
            <span class="badge blue">${insights.length} insights</span>
          </div>
          <div class="stack">
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
              <h2 class="section-title">OTs atrasadas críticas</h2>
              <div class="small-muted">Abiertas vencidas y entregas completadas fuera de fecha.</div>
            </div>
	            <button class="button-ghost small" data-module="work-orders">Abrir panel</button>
          </div>
          <div class="stack">
            ${[...overdueOpen, ...lateCompleted]
              .slice(0, 8)
              .map((order) => {
                const brand = getBrand(order.brandId);
                return `
                  <div class="mini-card">
                    <div class="row between">
                      <strong>${order.id}</strong>
                      <span class="badge ${isDeliveredWorkOrder(order) ? "amber" : "red"}">${isDeliveredWorkOrder(order) ? "Entregada tarde" : "Vencida abierta"}</span>
                    </div>
                    <span>${order.title}</span>
                    <span class="muted">${getClient(brand.clientId)?.name || "Cliente"} / ${brand.shortName} / ${formatDate(order.dueDate)}</span>
                    <button class="button-ghost small" data-action="view-work-order" data-id="${order.id}">Ver OT</button>
                  </div>
                `;
              })
              .join("") || `<div class="empty compact-empty">Sin atrasos visibles en este scope</div>`}
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
          <h2 class="section-title">Equipo, carga y alertas</h2>
          <div class="small-muted">Responsables, marcas, carga de OTs y preferencias de email.</div>
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
                          <strong>Carga operativa</strong>
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
      ${clients
        .map((clientItem) => {
          const clientBrands = brands.filter((brand) => brand.clientId === clientItem.id);
          if (!clientBrands.length) return "";
          return `
            <div class="brand-check-group">
              <strong>${clientItem.name}</strong>
              <div class="brand-check-list">
                ${clientBrands
                  .map(
                    (brand) => `
                      <label class="checkbox-line">
                        <input
                          type="checkbox"
                          data-admin-user-brand="${brand.id}"
                          ${selected.has(brand.id) ? "checked" : ""}
                          ${disabled ? "disabled" : ""}
                        />
                        ${brand.shortName}
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
              ${Object.keys(roleLabels)
                .map((role) => `<option value="${role}" ${selectedRole === role ? "selected" : ""}>${roleLabels[role]}</option>`)
                .join("")}
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
            <div class="field-help">Admin y Dirección pueden ver todo; las marcas ayudan a ordenar asignaciones y carga.</div>
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

function renderSettings() {
  const openOrders = workOrders.filter(isOpenWorkOrder);
  const overdueOrders = openOrders.filter((order) => daysUntil(order.dueDate) < 0);
  const profile = dataState.profile;
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
      <section class="grid grid-2">
        <div class="panel section">
          <div class="section-header">
            <h2 class="section-title">Sesion</h2>
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
              <span class="muted">${canManage ? "Puede administrar usuarios y marcas" : "Puede consultar datos operativos"}</span>
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
            <h2 class="section-title">Sistema</h2>
            <span class="badge blue">Operativo</span>
          </div>
          <div class="quick-action-grid">
            <button class="button" data-module="work-orders">Órdenes de trabajo</button>
            <button class="button-ghost" data-module="team">Equipo</button>
            <button class="button-ghost" data-module="notifications">Notificaciones</button>
            <button class="button-danger" data-action="logout">Cerrar sesion</button>
          </div>
        </div>
      </section>
      ${renderAdminUserManager(canManage)}
    </section>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-module]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!canOpenModule(button.dataset.module)) {
        showToast("Esta vista no esta disponible en el workspace operativo");
        return;
      }
      state.currentModule = button.dataset.module;
      if (state.currentModule !== "work-orders") {
        state.editingWorkOrderId = "";
        state.viewingWorkOrderId = "";
        state.focusedWorkOrderId = "";
      }
      render();
    });
  });

  document.querySelectorAll(".js-brand-select").forEach((brandSelect) => {
    brandSelect.addEventListener("change", (event) => {
      state.currentBrandId = event.target.value;
      state.editingWorkOrderId = "";
      state.viewingWorkOrderId = "";
      state.focusedWorkOrderId = "";
      const firstContent = brandItems(event.target.value)[0];
      state.selectedContentId = firstContent?.id || null;
      render();
    });
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
      state.currentBrandId = button.dataset.brandJump;
      state.editingWorkOrderId = "";
      state.viewingWorkOrderId = "";
      const firstContent = brandItems(state.currentBrandId)[0];
      state.selectedContentId = firstContent?.id || null;
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

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action, button.dataset.id));
  });

  document.querySelectorAll(".assignee-search").forEach((input) => {
    input.addEventListener("input", () => {
      const query = input.value.trim().toLowerCase();
      document.querySelectorAll("[data-assignee-option]").forEach((option) => {
        option.hidden = query && !option.dataset.assigneeOption.includes(query);
      });
    });
  });

  document.querySelectorAll("[data-ot-assignee]").forEach((input) => {
    input.addEventListener("change", refreshAssigneeSelectedList);
  });

  ["ot-category", "ot-priority"].forEach((fieldId) => {
    document.getElementById(fieldId)?.addEventListener("change", refreshWorkOrderGuidancePanels);
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

  document.querySelectorAll("[data-workorder-filter]").forEach((input) => {
    input.addEventListener("change", () => {
      state.workOrderFilters[input.dataset.workorderFilter] = input.value;
      render();
    });
  });

  document.querySelectorAll("[data-workorder-quick-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.workorderQuickFilter;
      state.workOrderFilters.quick = state.workOrderFilters.quick === selected ? "" : selected;
      state.currentModule = "work-orders";
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

function refreshWorkOrderGuidancePanels() {
  const category = document.getElementById("ot-category")?.value || "diseno";
  const priority = document.getElementById("ot-priority")?.value || "medium";
  const gate = document.getElementById("supervisor-gate-panel");
  const planner = document.querySelector(".urgent-planner-panel");
  if (gate) gate.innerHTML = renderSupervisorGatePanelContent(category);
  if (planner) {
    const next = document.createElement("div");
    next.innerHTML = renderUrgentPlannerPanel(category, priority);
    const replacement = next.firstElementChild;
    planner.replaceWith(replacement);
    replacement.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => handleAction(button.dataset.action, button.dataset.id));
    });
  }
}

function focusWorkOrderAi() {
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
  state.currentModule = "work-orders";
  state.showArchivedWorkOrders = false;
  state.editingWorkOrderId = "";
  state.viewingWorkOrderId = "";
  state.focusedWorkOrderId = "";
  render();
  window.setTimeout(() => focusWorkOrderAi(), 0);
}

function clearWorkOrderFilters() {
  state.workOrderFilters = { assignee: "", status: "", priority: "", due: "", quick: "" };
  render();
}

function focusUrgentOrders() {
  document.querySelector("[data-urgent-orders-panel]")?.scrollIntoView({ block: "center", behavior: "smooth" });
}

function draftWorkOrderFromAiComposer() {
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
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action, button.dataset.id));
  });
}

async function handleAction(action, id) {
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
      state.currentModule = "copywriting";
      showToast("IA lista con el contexto actualizado de marca");
    },
    "export-brand-config": () => showToast("Resumen de marca preparado para compartir internamente"),
    "fill-work-order-ai": () => fillWorkOrderWithAi(),
    "draft-work-order-ai": () => draftWorkOrderFromAiComposer(),
    "focus-work-order-ai": () => focusWorkOrderAi(),
    "open-create-work-order": () => openCreateWorkOrder(),
    "clear-work-order-filters": () => clearWorkOrderFilters(),
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
    "advance-order": () => advanceWorkOrder(id),
    "archive-work-order": () => archiveWorkOrder(id),
    "unarchive-work-order": () => unarchiveWorkOrder(id),
    "toggle-archived-work-orders": () => toggleArchivedWorkOrders(),
    "upload-order-materials": () => uploadOrderMaterials(id),
    "open-work-order-file": () => openWorkOrderFile(id),
    "delete-work-order-file": () => deleteWorkOrderFile(id),
    "send-urgent-alert": () => sendUrgentWorkOrderAlert(id),
    "apply-urgent-workload-plan": () => applyUrgentWorkloadPlan(id),
    "preview-weekly-digest": () => previewWeeklyDigest(),
    "queue-weekly-digest": () => queueWeeklyDigest(),
    "send-email-queue": () => sendEmailQueue(),
    "run-weekly-digest-now": () => runWeeklyDigestNow(),
    "run-monthly-content-matrix": () => runMonthlyWorkOrderAutomation("content_matrix"),
    "run-monthly-paid-placement": () => runMonthlyWorkOrderAutomation("paid_placement"),
    "download-report-pdf": () => downloadReportPdf(),
    "download-workspace-backup": () => downloadWorkspaceBackup(),
    "download-workspace-json": () => downloadWorkspaceJsonBackup(),
    "new-admin-user": () => newAdminUser(),
    "save-admin-user": () => saveAdminUser(),
    "deactivate-admin-user": () => setAdminUserActive(id, false),
    "activate-admin-user": () => setAdminUserActive(id, true),
  };

  if (actionMap[action]) {
    await actionMap[action]();
  }
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
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    dataState.loading = false;
    dataState.error = error.message;
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

async function logout() {
  if (isSupabaseMode()) {
    await supabaseClient.auth.signOut();
    dataState.session = null;
    dataState.profile = null;
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
  const assigneeCheckboxes = Array.from(document.querySelectorAll("[data-ot-assignee]:checked"));
  const assigneeSelect = document.getElementById("ot-assignees");
  const assignees = assigneeCheckboxes.length
    ? assigneeCheckboxes.map((input) => input.value)
    : assigneeSelect
      ? Array.from(assigneeSelect.selectedOptions).map((option) => option.value)
      : [];
  const dueDate = document.getElementById("ot-due-date")?.value || "";
  const priority = document.getElementById("ot-priority")?.value || "medium";
  const status = document.getElementById("ot-status")?.value || "new";
  const category = document.getElementById("ot-category")?.value || "diseno";
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
  return {
    title,
    assignees,
    dueDate,
    priority,
    status,
    category,
    description,
    subtasks,
    materialChanges,
    notifyOnEmail,
    fileUploads,
    files,
  };
}

function validateWorkOrderValues(values) {
  if (!values.title) {
    showToast("Agrega un título para crear la OT");
    return false;
  }
  if (!values.assignees.length) {
    showToast("Selecciona al menos un responsable");
    return false;
  }
  return true;
}

function applySupervisorGateToValues(values, brandId = state.currentBrandId) {
  if (!requiresSupervisorGate(values.category)) {
    values.supervisorGate = { required: false, supervisors: [] };
    return values;
  }
  const supervisors = supervisorCandidates(values.category, brandId);
  const supervisorIds = supervisors.map((user) => user.id);
  const nextAssignees = Array.from(new Set([...supervisorIds, ...values.assignees]));
  const gateTask = "Jefe inmediato revisa la OT, asigna responsable final y confirma deadline";
  const nextSubtasks = values.subtasks.some((task) => plainText(task).toLowerCase() === gateTask.toLowerCase())
    ? values.subtasks
    : [gateTask, ...values.subtasks];

  values.assignees = nextAssignees;
  values.subtasks = nextSubtasks;
  values.description = composeWorkOrderDescription(
    splitWorkOrderDescription(values.description).description,
    nextSubtasks,
    values.materialChanges,
  );
  values.supervisorGate = { required: true, supervisors };
  return values;
}

function fillWorkOrderWithAi(promptOverride = "") {
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

  if (titleInput) titleInput.value = draft.title;
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

  refreshWorkOrderGuidancePanels();
  showToast("Borrador armado con IA. Revisa y presiona Crear OT para guardarla.");
}

function optimizeWorkOrderUrgency() {
  if (isAllBrandsScope()) {
    showToast("Selecciona una marca para calcular carga de urgencias");
    return;
  }
  const category = document.getElementById("ot-category")?.value || "diseno";
  const plan = urgentWorkOrderPlan({ category, priority: "high" });
  const dueDateInput = document.getElementById("ot-due-date");
  const priorityInput = document.getElementById("ot-priority");
  const subtasksInput = document.getElementById("ot-subtasks");
  const existingTasks = parseListLines(subtasksInput?.value || "");
  const urgentTask = "Confirmar prioridad urgente y fecha ideal segun carga del equipo";

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
  refreshWorkOrderGuidancePanels();
  showToast(plan.candidate ? `Sugerencia aplicada: ${plan.candidate.name} / ${formatDate(plan.dueDate)}` : "Fecha urgente sugerida; falta responsable disponible");
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

function buildWorkOrderAssignmentEmail({ code, brandId, title, values, uploadedCount }) {
  const brand = getBrand(brandId);
  const client = getClient(brand.clientId);
  const workOrderUrl = buildWorkOrderUrl(code, brandId);
  const assigneeNames = values.assignees.map((userId) => userName(userId)).join(", ");
  const creatorName = dataState.profile?.full_name || "Lumen Workspace";
  const parsedDescription = splitWorkOrderDescription(values.description);
  const description = plainText(parsedDescription.description);
  const supervisorGate = values.supervisorGate?.required;
  const supervisorNames = values.supervisorGate?.supervisors?.map((user) => user.name).join(", ") || "";
  const fileLabel =
    uploadedCount === 0 ? "Sin archivos adjuntos" : uploadedCount === 1 ? "1 archivo adjunto" : `${uploadedCount} archivos adjuntos`;

  return `
    <div style="margin:0;background:#f6f6f3;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;color:#2d2d2d;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #deded8;border-radius:14px;overflow:hidden;">
        <div style="padding:26px 28px 20px;border-left:7px solid #49ee8c;">
          <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5f6b61;margin-bottom:10px;">
            Nueva orden asignada
          </div>
          <h1 style="margin:0 0 8px;font-size:28px;line-height:1.15;color:#2d2d2d;">${escapeHtml(code)}</h1>
          <p style="margin:0;color:#5f6760;font-size:17px;line-height:1.45;">${escapeHtml(title)}</p>
        </div>

        <div style="padding:0 28px 24px;">
          ${
            supervisorGate
              ? `
                <div style="margin:16px 0 8px;border:1px solid #f3d59e;border-radius:12px;background:#fff7e5;padding:14px 16px;">
                  <div style="font-size:13px;font-weight:800;text-transform:uppercase;color:#8a5a12;margin-bottom:6px;">Requiere asignacion de jefe inmediato</div>
                  <div style="font-size:15px;line-height:1.5;color:#4b4232;">
                    Esta OT entra primero a ${escapeHtml(supervisorNames || "Dirección/Cuentas")} para confirmar responsable final y deadline antes de ejecutar.
                  </div>
                </div>
              `
              : ""
          }
          <table role="presentation" style="width:100%;border-collapse:collapse;margin:10px 0 22px;">
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Cliente / marca</td>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">${escapeHtml(client?.name || "Cliente")} / ${escapeHtml(brand.name)}</td>
            </tr>
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Deadline</td>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">${escapeHtml(formatDate(values.dueDate))}</td>
            </tr>
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Prioridad</td>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">${escapeHtml(workOrderPriorityLabels[values.priority] || values.priority)}</td>
            </tr>
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Estado</td>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">${escapeHtml(workOrderStatusLabels[values.status] || values.status)}</td>
            </tr>
            <tr>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;color:#6b726c;">Categoria</td>
              <td style="padding:11px 0;border-bottom:1px solid #ecece8;text-align:right;font-weight:700;">${escapeHtml(workOrderCategoryLabels[values.category] || values.category)}</td>
            </tr>
          </table>

          <div style="margin-bottom:18px;">
            <div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#6b726c;margin-bottom:6px;">Responsables</div>
            <div style="font-size:16px;line-height:1.45;">${escapeHtml(assigneeNames || "Sin responsables")}</div>
          </div>

          <div style="margin-bottom:22px;">
            <div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#6b726c;margin-bottom:6px;">Contexto</div>
            <div style="font-size:16px;line-height:1.55;color:#3c403d;">${escapeHtml(description || "Sin descripcion agregada.")}</div>
          </div>

          ${
            parsedDescription.subtasks.length || parsedDescription.materialChanges.length
              ? `
                <div style="margin-bottom:22px;border:1px solid #ecece8;border-radius:12px;padding:14px 16px;background:#fafaf8;">
                  ${
                    parsedDescription.subtasks.length
                      ? `<div style="font-size:14px;line-height:1.55;margin-bottom:8px;"><strong>Subtareas:</strong> ${escapeHtml(parsedDescription.subtasks.join(" / "))}</div>`
                      : ""
                  }
                  ${
                    parsedDescription.materialChanges.length
                      ? `<div style="font-size:14px;line-height:1.55;"><strong>Cambios en materiales:</strong> ${escapeHtml(parsedDescription.materialChanges.join(" / "))}</div>`
                      : ""
                  }
                </div>
              `
              : ""
          }

          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px;">
            <span style="display:inline-block;background:#e9fff1;color:#176339;border-radius:999px;padding:8px 12px;font-weight:700;">${escapeHtml(fileLabel)}</span>
            <span style="display:inline-block;background:#f0f1ee;color:#555b56;border-radius:999px;padding:8px 12px;">Creada por ${escapeHtml(creatorName)}</span>
          </div>

          <a href="${escapeHtml(workOrderUrl)}" style="display:inline-block;background:#2d2d2d;color:#ffffff;text-decoration:none;border-radius:10px;padding:14px 18px;font-size:16px;font-weight:800;">
            Ver orden en Lumen
          </a>

          <p style="margin:20px 0 0;color:#7a817b;font-size:13px;line-height:1.45;">
            Si el boton no abre, copia este link en tu navegador:<br/>
            <a href="${escapeHtml(workOrderUrl)}" style="color:#2d2d2d;">${escapeHtml(workOrderUrl)}</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

function workOrderRecipientUsers(order, assigneeIds = orderAssignees(order)) {
  return users.filter((user) => assigneeIds.includes(user.id) && user.email && user.isActive !== false);
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
  if (!recipients.length) return 0;
  const htmlBody = buildWorkOrderUpdateEmail(order, changes, uploadedCount);
  const { error } = await supabaseClient.from("email_notifications").insert(
    recipients.map((user) => ({
      brand_id: order.brandId,
      work_order_id: order.dbId,
      recipient_user_id: user.id,
      recipient_email: user.email,
      notification_type: "status_change",
      subject: `Actualizacion de OT: ${order.id} - ${order.title}`,
      html_body: htmlBody,
      status: "queued",
      scheduled_for: new Date().toISOString(),
    })),
  );
  if (error) {
    showToast(`OT actualizada, pero fallo email: ${error.message}`);
    return 0;
  }
  await invokeEmailFunction("email-worker", (data) => `Correos de actualizacion procesados: ${data?.processed ?? 0}`, {}, true);
  return recipients.length;
}

function urgentAlertRecipients(order) {
  return activeUsers().filter(
    (user) =>
      ["admin", "directora", "cuentas"].includes(user.role) &&
      user.email &&
      canUserAccessBrand(user, order.brandId),
  );
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
  if (!canCreateWorkOrders()) {
    showToast("Solo Dirección, Cuentas, Generador o Creativo puede crear órdenes");
    return;
  }
  if (isAllBrandsScope()) {
    showToast("Selecciona una marca antes de crear una OT");
    return;
  }
  const values = applySupervisorGateToValues(getWorkOrderFormValues(), state.currentBrandId);
  if (!validateWorkOrderValues(values)) return;
  const code = `OT-${getBrand().shortName.toUpperCase().replaceAll(" ", "-")}-${String(workOrders.length + 1).padStart(3, "0")}`;

  if (isSupabaseMode()) {
    const { data: insertedOrder, error: orderError } = await supabaseClient
      .from("work_orders")
      .insert({
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
      })
      .select()
      .single();

    if (orderError) {
      const message = orderError.message || "";
      if (message.includes("work_order_status") || message.includes("client_approved") || message.includes("scheduled")) {
        showToast("Supabase no aceptó ese estado. Usa Nueva, En proceso, En revisión, Entregada o Cancelada.");
      } else {
        showToast(`No se pudo crear la OT: ${message}`);
      }
      return;
    }

    if (values.assignees.length) {
      const { error: assigneeError } = await supabaseClient.from("work_order_assignees").insert(
        values.assignees.map((userId) => ({
          work_order_id: insertedOrder.id,
          user_id: userId,
          assigned_by: dataState.session?.user?.id,
        })),
      );
      if (assigneeError) {
        showToast(`OT creada, pero fallo responsables: ${assigneeError.message}`);
      }
    }

    const uploadedCount = await uploadWorkOrderFiles(insertedOrder.id, state.currentBrandId, values.fileUploads);

    await supabaseClient.from("work_order_activity").insert({
      work_order_id: insertedOrder.id,
      actor_id: dataState.session?.user?.id,
      action: "created",
      details: { title: values.title, assignees: values.assignees.length, files: uploadedCount },
    });

    if (values.notifyOnEmail) {
      const recipients = users.filter((user) => values.assignees.includes(user.id));
      if (recipients.length) {
        const htmlBody = buildWorkOrderAssignmentEmail({
          code,
          brandId: state.currentBrandId,
          title: values.title,
          values,
          uploadedCount,
        });
        const { error: emailError } = await supabaseClient.from("email_notifications").insert(
          recipients.map((user) => ({
            brand_id: state.currentBrandId,
            work_order_id: insertedOrder.id,
            recipient_user_id: user.id,
            recipient_email: user.email,
            notification_type: "assignment",
            subject: `${values.supervisorGate?.required ? "Requiere asignacion de jefe: " : "Nueva OT asignada: "}${code} - ${values.title}`,
            html_body: htmlBody,
            status: "queued",
          })),
        );
        if (emailError) showToast(`OT creada, pero fallo email: ${emailError.message}`);
        else await invokeEmailFunction("email-worker", (data) => `OT creada y correos procesados: ${data?.processed ?? 0}`, {}, true);
      }
    }

    await loadSupabaseData();
    showToast(`OT creada en Supabase: ${code}`);
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
    dueDate: values.dueDate || "2026-05-08",
    assignee: values.assignees[0],
    assignees: values.assignees,
    description: values.description,
    files: values.files,
    createdBy: "giu",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notifyOnEmail: values.notifyOnEmail,
    linkedContentId: state.selectedContentId,
  });
  saveWorkOrders();
  showToast(`OT creada y ${values.notifyOnEmail ? "email preparado" : "sin email"}`);
  render();
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
    showToast("No hay Dirección/Cuentas asignados a esta marca");
    return;
  }

  const confirmed = window.confirm(
    `Esto enviará una alerta urgente de ${order.id} a ${recipients.length} persona(s) de Dirección/Cuentas. ¿Enviar ahora?`,
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

function viewWorkOrder(id) {
  const order = workOrders.find((candidate) => candidate.id === id);
  if (!order) {
    showToast("No encontre esa OT");
    return;
  }
  state.currentModule = "work-orders";
  state.currentBrandId = order.brandId;
  state.viewingWorkOrderId = id;
  state.focusedWorkOrderId = id;
  showToast(`Abriendo ${id}`);
  render();
}

function closeWorkOrderDetail() {
  state.viewingWorkOrderId = "";
  state.focusedWorkOrderId = "";
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
  state.currentModule = "work-orders";
  state.currentBrandId = order.brandId;
  state.editingWorkOrderId = id;
  state.viewingWorkOrderId = id;
  state.focusedWorkOrderId = id;
  showToast(`Editando ${id}`);
  render();
}

function cancelEditWorkOrder() {
  state.editingWorkOrderId = "";
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
  const values = getWorkOrderFormValues();
  if (!validateWorkOrderValues(values)) return;

  if (isSupabaseMode()) {
    if (!order.dbId) {
      showToast("Esta OT no tiene ID de Supabase");
      return;
    }

    const { error: orderError } = await supabaseClient
      .from("work_orders")
      .update({
        title: values.title,
        status: values.status,
        priority: values.priority,
        category: values.category,
        due_date: values.dueDate || null,
        description: values.description,
        notify_on_email: values.notifyOnEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.dbId);
    if (orderError) {
      const message = orderError.message || "";
      if (message.includes("work_order_status") || message.includes("client_approved") || message.includes("scheduled")) {
        showToast("Supabase no aceptó ese estado. Usa Nueva, En proceso, En revisión, Entregada o Cancelada.");
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
      notifyOnEmail: values.notifyOnEmail,
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
      },
    });
    await queueWorkOrderUpdateEmails(updatedOrderForEmail, changes, uploadedCount, values.assignees);

    await loadSupabaseData();
    state.editingWorkOrderId = "";
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
  order.notifyOnEmail = values.notifyOnEmail;
  order.updatedAt = new Date().toISOString();
  if (order.linkedContentId && order.status === "completed") {
    const linked = contentItems.find((item) => item.id === order.linkedContentId);
    if (linked && linked.status !== "approved") linked.status = "internal_review";
    saveContentItems();
  }
  saveWorkOrders();
  state.editingWorkOrderId = "";
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

async function updateOrderStatusFromSelect(id) {
  const order = workOrders.find((candidate) => candidate.id === id);
  if (!order) return;
  const select = document.querySelector(`[data-status-select="${id}"]`);
  await setWorkOrderStatus(order, select?.value);
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

async function applyUrgentWorkloadPlan(id) {
  if (!canManageWorkOrders()) {
    showToast("Solo Dirección o Cuentas puede aplicar plan de urgencia");
    return;
  }
  const order = workOrders.find((candidate) => candidate.id === id);
  if (!order) return;
  const plan = urgentWorkOrderPlan({ category: order.category, brandId: order.brandId, priority: "high" });
  const currentAssignees = orderAssignees(order);
  const nextAssignees = plan.candidate
    ? Array.from(new Set([...currentAssignees, plan.candidate.id]))
    : currentAssignees;
  const changes = [
    `Prioridad marcada como Alta`,
    `Deadline sugerido por carga: ${formatDate(order.dueDate)} -> ${formatDate(plan.dueDate)}`,
  ];
  if (plan.candidate && !currentAssignees.includes(plan.candidate.id)) {
    changes.push(`Responsable sugerido por carga: ${plan.candidate.name}`);
  }

  if (isSupabaseMode()) {
    if (!order.dbId) {
      showToast("Esta OT no tiene ID de Supabase");
      return;
    }
    const { error } = await supabaseClient
      .from("work_orders")
      .update({ priority: "high", due_date: plan.dueDate, updated_at: new Date().toISOString() })
      .eq("id", order.dbId);
    if (error) {
      showToast(`No se pudo aplicar plan urgente: ${error.message}`);
      return;
    }
    const addedAssignees = nextAssignees.filter((userId) => !currentAssignees.includes(userId));
    if (addedAssignees.length) {
      const { error: assigneeError } = await supabaseClient.from("work_order_assignees").insert(
        addedAssignees.map((userId) => ({
          work_order_id: order.dbId,
          user_id: userId,
          assigned_by: dataState.session?.user?.id,
        })),
      );
      if (assigneeError) {
        showToast(`Plan aplicado, pero fallo responsable sugerido: ${assigneeError.message}`);
      }
    }
    const updatedOrderForEmail = { ...order, priority: "high", dueDate: plan.dueDate, assignees: nextAssignees };
    await supabaseClient.from("work_order_activity").insert({
      work_order_id: order.dbId,
      actor_id: dataState.session?.user?.id,
      action: "urgent_rebalanced",
      details: { due_date: plan.dueDate, suggested_user: plan.candidate?.id || null },
    });
    await queueWorkOrderUpdateEmails(updatedOrderForEmail, changes, 0, nextAssignees);
    await loadSupabaseData();
  } else {
    order.priority = "high";
    order.dueDate = plan.dueDate;
    order.assignees = nextAssignees;
    order.assignee = nextAssignees[0] || order.assignee;
    order.updatedAt = new Date().toISOString();
    saveWorkOrders();
  }

  state.viewingWorkOrderId = order.id;
  state.focusedWorkOrderId = order.id;
  showToast(`Plan urgente aplicado a ${order.id}: ${formatDate(plan.dueDate)}`);
  render();
}

function archiveMigrationMessage(message = "") {
  return message.includes("archived_at") || message.includes("column")
    ? "Falta activar archivo de OTs en Supabase: ejecuta supabase/patch_work_order_archive.sql"
    : "";
}

function toggleArchivedWorkOrders() {
  state.showArchivedWorkOrders = !state.showArchivedWorkOrders;
  state.editingWorkOrderId = "";
  state.viewingWorkOrderId = "";
  state.focusedWorkOrderId = "";
  showToast(state.showArchivedWorkOrders ? "Mostrando OTs archivadas" : "Mostrando panel activo");
}

async function setWorkOrderArchived(id, shouldArchive) {
  if (!canManageWorkOrders()) {
    showToast("Solo Dirección o Cuentas puede archivar órdenes");
    return;
  }
  const order = workOrders.find((candidate) => candidate.id === id);
  if (!order) return;
  if (isArchivedWorkOrder(order) === shouldArchive) {
    showToast(shouldArchive ? "Esta OT ya esta archivada" : "Esta OT ya esta activa");
    return;
  }
  const archivedAt = shouldArchive ? new Date().toISOString() : null;

  if (isSupabaseMode()) {
    const { error } = await supabaseClient
      .from("work_orders")
      .update({ archived_at: archivedAt, updated_at: new Date().toISOString() })
      .eq("id", order.dbId);
    if (error) {
      showToast(archiveMigrationMessage(error.message || "") || `No se pudo ${shouldArchive ? "archivar" : "restaurar"} la OT: ${error.message}`);
      return;
    }
    await supabaseClient.from("work_order_activity").insert({
      work_order_id: order.dbId,
      actor_id: dataState.session?.user?.id,
      action: shouldArchive ? "archived" : "unarchived",
      details: { archived_at: archivedAt },
    });
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

function previewWeeklyDigest() {
  const totalOpen = workOrders.filter(isOpenWorkOrder).length;
  const totalOverdue = workOrders.filter((order) => isOpenWorkOrder(order) && daysUntil(order.dueDate) < 0).length;
  showToast(`Resumen semanal: ${totalOpen} OTs abiertas y ${totalOverdue} vencidas. Esto solo es vista previa.`);
}

async function invokeEmailFunction(functionName, successMessage, extraBody = {}, allowCreators = false) {
  if (!isSupabaseMode()) {
    showToast("Conecta Supabase para usar emails reales");
    return null;
  }
  if (!(canManageWorkOrders() || (allowCreators && canRunOperationalEmail()))) {
    showToast("Solo roles operativos autorizados pueden disparar automatizaciones");
    return null;
  }

  try {
    const { data, error } = await supabaseClient.functions.invoke(functionName, {
      body: { triggered_by: dataState.session?.user?.id, ...extraBody },
    });
    if (error) throw error;
    showToast(typeof successMessage === "function" ? successMessage(data) : successMessage);
    return data;
  } catch (error) {
    showToast(error.message || `No se pudo ejecutar ${functionName}`);
    return null;
  }
}

async function runMonthlyWorkOrderAutomation(kind) {
  const labels = {
    content_matrix: "matrices de contenido",
    paid_placement: "órdenes de pauta",
  };
  const confirmed = window.confirm(
    `Esto creará ${labels[kind] || "órdenes automáticas"} y dejará los correos preparados para los responsables. ¿Continuar?`,
  );
  if (!confirmed) return null;

  const data = await invokeEmailFunction(
    "monthly-work-orders",
    (result) => `${result?.created ?? 0} OTs creadas y ${result?.emails_queued ?? 0} correos preparados`,
    { kind },
  );
  if (data) await loadSupabaseData();
  return data;
}

async function queueWeeklyDigest() {
  return invokeEmailFunction(
    "weekly-digest",
    (data) => `Correos preparados para ${data?.queued ?? 0} personas. Aun no se han enviado.`,
  );
}

async function sendEmailQueue() {
  const confirmed = window.confirm(
    "Esto enviara los correos que ya estan preparados usando Brevo. Si hay correos pendientes, el equipo los recibira ahora. ¿Enviar pendientes?",
  );
  if (!confirmed) return null;

  return invokeEmailFunction(
    "email-worker",
    (data) => `Correos enviados o revisados: ${data?.processed ?? 0}`,
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
    (data) => `Resumen semanal enviado. Correos procesados: ${data?.processed ?? 0}`,
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

initializeApp();
