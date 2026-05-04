const modules = [
  { key: "dashboard", label: "Dashboard", icon: "DB" },
  { key: "brand-config", label: "Config. de marca", icon: "BR" },
  { key: "work-orders", label: "Ordenes de trabajo", icon: "OT" },
  { key: "notifications", label: "Notificaciones", icon: "NT" },
  { key: "productions", label: "Producciones", icon: "PR" },
  { key: "content", label: "Contenido", icon: "CO" },
  { key: "assets", label: "Assets / Canva", icon: "CA" },
  { key: "copywriting", label: "Copywriting IA", icon: "CP" },
  { key: "creativity", label: "Creatividad IA", icon: "IA" },
  { key: "reports", label: "Reporteria", icon: "RP" },
  { key: "team", label: "Equipo", icon: "EQ" },
  { key: "client-portal", label: "Portal cliente", icon: "CL" },
  { key: "roadmap", label: "Roadmap", icon: "RM" },
  { key: "settings", label: "Sistema", icon: "CF" },
];

const ALL_BRANDS_ID = "all-brands";
const LAUNCH_MODE = true;
const launchModuleKeys = ["dashboard", "work-orders", "team", "notifications", "settings"];
const launchBlockedModules = modules.filter((module) => !launchModuleKeys.includes(module.key));
let supabaseClient = null;

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

const roadmapPhases = [
  {
    id: "fase-0",
    label: "Fase 0",
    title: "Fundamento de datos",
    duration: "1 semana",
    status: "in_progress",
    items: ["clients + brands.client_id", "7 roles", "brand_memberships", "module_permissions + RLS"],
  },
  {
    id: "fase-1",
    label: "Fase 1",
    title: "Configuracion de Marca",
    duration: "1-2 semanas",
    status: "in_progress",
    items: ["7 secciones fundacionales", "auto-save", "rail como se usa", "Gemini config"],
  },
  {
    id: "fase-2",
    label: "Fase 2",
    title: "Contenido + Calendario dos fases",
    duration: "2 semanas",
    status: "planned",
    items: ["calendarios mensuales", "estados explicitos", "toggle concepto/final/programado", "composer de concepto"],
  },
  {
    id: "fase-3",
    label: "Fase 3",
    title: "Canva Visual Workflow",
    duration: "1 semana",
    status: "planned",
    items: ["canva_designs", "preview + link", "version aprobada bloqueada", "asset vinculado a pieza"],
  },
  {
    id: "fase-4",
    label: "Fase 4",
    title: "Loop OT - Contenido",
    duration: "3-5 dias",
    status: "planned",
    items: ["linked_content_item_id", "OT desde concepto", "actualizar pieza al completar OT"],
  },
  {
    id: "fase-5",
    label: "Fase 5",
    title: "Portal Cliente",
    duration: "1-2 semanas",
    status: "planned",
    items: ["login cliente", "magic link invitado", "calendario read-only", "comentarios internos ocultos"],
  },
  {
    id: "fase-6",
    label: "Fase 6",
    title: "Reporteria v1",
    duration: "1 semana",
    status: "planned",
    items: ["CSV manual", "report_snapshots", "dashboards", "PDF mensual"],
  },
  {
    id: "fase-7",
    label: "Fase 7",
    title: "Conexiones e IA en flujos",
    duration: "1 semana",
    status: "planned",
    items: ["IA dentro de pieza", "ideas al calendario", "producciones a multiples piezas"],
  },
];

const nextImprovements = [
  {
    title: "Conectar Configuracion de Marca a datos reales",
    owner: "Fase 1",
    impact: "Hace que IA, contenido y reporteria lean la misma verdad de marca.",
  },
  {
    title: "Convertir Contenido en flujo operable",
    owner: "Fase 2",
    impact: "Estados, versiones, comentarios y aprobaciones dejan de ser mock visual.",
  },
  {
    title: "Separar experiencia interna y cliente",
    owner: "Fase 5",
    impact: "Evita que clientes vean comentarios internos o configuracion sensible.",
  },
  {
    title: "Pulir mobile y dashboard ejecutivo",
    owner: "UX",
    impact: "El workspace se siente confiable en reuniones y revisiones rapidas.",
  },
];

const moduleHealth = [
  ["Datos base", 68, "Fase 0"],
  ["Config. marca", 45, "Fase 1"],
  ["Contenido", 36, "Fase 2"],
  ["Portal cliente", 28, "Fase 5"],
  ["Reporteria", 22, "Fase 6"],
];

const launchChecklist = [
  {
    title: "UI operativa de OTs",
    status: "done",
    detail: "Dashboard global, kanban, responsables multiples, archivos mock y carga de equipo.",
  },
  {
    title: "Schema MVP Supabase",
    status: "done",
    detail: "Archivo launch_mvp.sql preparado para OTs, equipo, emails, RLS y storage.",
  },
  {
    title: "Auth y usuarios reales",
    status: "next",
    detail: "Crear perfiles internos, roles y brand_memberships en el proyecto Supabase real.",
  },
  {
    title: "Conectar CRUD de OTs",
    status: "next",
    detail: "Reemplazar datos mock/localStorage por queries y mutations contra Supabase.",
  },
  {
    title: "Storage de adjuntos",
    status: "next",
    detail: "Subir archivos al bucket privado work-order-files por marca y OT.",
  },
  {
    title: "Emails reales",
    status: "next",
    detail: "Conectar assignment, vencimientos y digest lunes con Edge Function + proveedor email.",
  },
  {
    title: "QA piloto interno",
    status: "pending",
    detail: "Probar 5 usuarios, 3 marcas, permisos, mobile, errores y carga lenta.",
  },
  {
    title: "Deploy interno",
    status: "pending",
    detail: "Variables de entorno, dominio, backups y monitoreo basico antes de invitar al equipo.",
  },
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
      ["sla", "input", "SLA", "Tiempo esperado para revision, cambios y aprobacion."],
      ["legalNotes", "textarea", "Notas legales", "Restricciones, disclaimers o revisiones obligatorias."],
      ["escalation", "textarea", "Escalamiento", "Cuando una pieza debe subir a direccion o cliente."],
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
    name: "Repuestos y Talleres Continental",
    shortName: "Repuestos",
    color: "#18345d",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Comunidad", "Reporteria", "Pauta Meta"],
    monthlyGoal: 10,
    canvaFolder: "Continental / Repuestos",
  },
  {
    id: "seguros-continental",
    clientId: "continental",
    name: "Seguros y Fianzas Continental",
    shortName: "Seguros",
    color: "#2f9a68",
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
    color: "#127990",
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
    color: "#24466f",
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
    color: "#127990",
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
    color: "#2f9a68",
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
    color: "#18345d",
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
    color: "#127990",
    platforms: ["Facebook", "Instagram"],
    services: ["Publicacion", "Comunidad", "Reporteria"],
    monthlyGoal: 4,
    canvaFolder: "Lumen / Agencia",
  },
];

const users = [
  {
    id: "giu",
    name: "Giuliana Uzcategui",
    email: "guzcategui@grupolumen.com",
    role: "directora",
    brands: brands.map((brand) => brand.id),
  },
  {
    id: "vale",
    name: "Valeria Morales",
    email: "valeria@grupolumen.com",
    role: "creativo",
    brands: ["danone-gt", "silk-gt", "danonino-gt", "lumen-agencia"],
  },
  {
    id: "andrea",
    name: "Andrea Reyes",
    email: "andrea@grupolumen.com",
    role: "disenador",
    brands: ["repuestos-continental", "seguros-continental", "jim-gt", "silk-gt"],
  },
  {
    id: "diego",
    name: "Diego Castillo",
    email: "diego@grupolumen.com",
    role: "community",
    brands: ["jim-gt", "leap-gt", "volkswagen-gt", "camiones-vw-gt", "bestune-gt"],
  },
  {
    id: "cliente-danone",
    name: "Cliente Danone",
    email: "marketing.gt@danone.com",
    role: "cliente",
    brands: ["danone-gt", "silk-gt", "danonino-gt"],
  },
];

let workOrders = [
  {
    id: "OT-SILK-047",
    brandId: "silk-gt",
    title: "Carrusel beneficios bebida de almendra",
    status: "in_review",
    priority: "high",
    category: "diseno",
    dueDate: "2026-05-02",
    assignee: "andrea",
    assignees: ["andrea", "vale"],
    description: "Disenar carrusel final con beneficios, claims validados y CTA a producto.",
    files: [
      { name: "brief-silk-carrusel.pdf", size: 128000, type: "application/pdf" },
      { name: "referencia-empaque.png", size: 84000, type: "image/png" },
    ],
    createdBy: "vale",
    notifyOnEmail: true,
    linkedContentId: "ci-silk-01",
  },
  {
    id: "OT-DANONE-018",
    brandId: "danone-gt",
    title: "Copy campaña desayuno práctico",
    status: "in_progress",
    priority: "medium",
    category: "copy",
    dueDate: "2026-05-03",
    assignee: "vale",
    assignees: ["vale"],
    description: "Preparar caption y variantes de hook para desayuno practico.",
    files: [{ name: "notas-copy-danone.docx", size: 67000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }],
    createdBy: "giu",
    notifyOnEmail: true,
    linkedContentId: "ci-danone-01",
  },
  {
    id: "OT-JIM-012",
    brandId: "jim-gt",
    title: "Guion TikTok prueba de manejo",
    status: "new",
    priority: "medium",
    category: "produccion",
    dueDate: "2026-05-05",
    assignee: "diego",
    assignees: ["diego", "andrea"],
    description: "Estructurar guion con escenas, hook y CTA para test drive.",
    files: [],
    createdBy: "giu",
    notifyOnEmail: true,
    linkedContentId: "ci-jim-01",
  },
  {
    id: "OT-LUMEN-021",
    brandId: "lumen-agencia",
    title: "Post cultura interna Lumen",
    status: "completed",
    priority: "low",
    category: "diseno",
    dueDate: "2026-04-29",
    assignee: "andrea",
    assignees: ["andrea"],
    description: "Post interno de cultura Lumen con visual final aprobado.",
    files: [{ name: "bts-equipo-final.jpg", size: 214000, type: "image/jpeg" }],
    createdBy: "giu",
    notifyOnEmail: false,
    linkedContentId: "ci-lumen-01",
  },
];

const initialWorkOrders = workOrders.map((order) => ({ ...order }));
workOrders = loadStoredCollection("lumen_work_orders_v1", initialWorkOrders);

const notificationRules = [
  {
    id: "assignment",
    title: "Asignacion de OT",
    channel: "Email + in-app",
    recipients: "Responsable asignado",
    enabled: true,
  },
  {
    id: "deadline-24h",
    title: "Deadline en 24h",
    channel: "Email",
    recipients: "Responsable + directora",
    enabled: true,
  },
  {
    id: "overdue",
    title: "OT vencida",
    channel: "Email + in-app",
    recipients: "Responsable + creador + directora",
    enabled: true,
  },
  {
    id: "weekly-digest",
    title: "Digest lunes 8:00am",
    channel: "Email",
    recipients: "Equipo interno completo",
    enabled: true,
  },
];

const weeklyDigestConfig = {
  day: "Lunes",
  time: "08:00",
  timezone: "America/Mexico_City",
  subject: "Lumen Workspace - estatus semanal de proyectos",
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
        text: "Pendiente hook final para version de Reels.",
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
  toast: "",
};

const statusLabels = {
  draft: "Draft",
  internal_review: "Revision interna",
  client_review: "Revision cliente",
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
  in_review: "En revision",
  completed: "Completada",
  cancelled: "Cancelada",
};

const roleLabels = {
  admin: "Admin",
  directora: "Directora",
  creativo: "Creativo",
  disenador: "Disenador",
  community: "Community",
  pauta: "Pauta",
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
    color: row.color_primary || "#18345d",
    platforms: row.platforms || [],
    services: row.services || [],
    monthlyGoal: 10,
    canvaFolder: "",
    isActive: row.is_active,
  };
}

function mapDbUser(row, memberships = []) {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    brands: memberships.filter((membership) => membership.user_id === row.id).map((membership) => membership.brand_id),
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
    supabaseClient.from("profiles").select("*").eq("is_active", true).order("full_name"),
    supabaseClient
      .from("work_orders")
      .select(
        `
          *,
          assignees:work_order_assignees(user_id),
          files:work_order_files(id,file_name,file_type,file_size,storage_path)
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
    if (session) await loadSupabaseData();
  } catch (error) {
    dataState.error = error.message || "No se pudo conectar Supabase";
  } finally {
    dataState.loading = false;
    render();
  }

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    dataState.session = session;
    dataState.error = "";
    if (session) {
      dataState.loading = true;
      render();
      try {
        await loadSupabaseData();
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
  return LAUNCH_MODE ? modules.filter((module) => launchModuleKeys.includes(module.key)) : modules;
}

function getModuleMeta(key = state.currentModule) {
  return modules.find((module) => module.key === key) || modules[0];
}

function canOpenModule(key) {
  return !LAUNCH_MODE || launchModuleKeys.includes(key);
}

function isAllBrandsScope(brandId = state.currentBrandId) {
  return brandId === ALL_BRANDS_ID;
}

function getScopeTitle() {
  if (isAllBrandsScope()) return "Todas las marcas";
  return getBrand().name;
}

function getScopeSubtitle() {
  if (isAllBrandsScope()) return "Vista general / todas las marcas activas";
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

function renderBrandOptions(activeBrandId = state.currentBrandId) {
  return `
    <option value="${ALL_BRANDS_ID}" ${activeBrandId === ALL_BRANDS_ID ? "selected" : ""}>
      Todas las marcas
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
      sla: "24-48h para revision de piezas.",
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

function brandOrders(brandId = state.currentBrandId) {
  if (isAllBrandsScope(brandId)) return workOrders;
  return workOrders.filter((order) => order.brandId === brandId);
}

function orderAssignees(order) {
  if (Array.isArray(order.assignees) && order.assignees.length) return order.assignees;
  return order.assignee ? [order.assignee] : [];
}

function orderFiles(order) {
  return Array.isArray(order.files) ? order.files : [];
}

function internalUsers() {
  return users.filter((user) => user.role !== "cliente");
}

function userName(userId) {
  return users.find((user) => user.id === userId)?.name || "Sin asignar";
}

function userEmail(userId) {
  return users.find((user) => user.id === userId)?.email || "";
}

function daysUntil(dateValue) {
  if (!dateValue) return 999;
  const today = new Date("2026-05-04T12:00:00");
  const date = new Date(`${dateValue}T12:00:00`);
  return Math.ceil((date - today) / 86400000);
}

function workOrderUrgency(order) {
  if (order.status === "completed") return { label: "Completada", cls: "green" };
  const days = daysUntil(order.dueDate);
  if (days < 0) return { label: `Vencida hace ${Math.abs(days)}d`, cls: "red" };
  if (days === 0) return { label: "Vence hoy", cls: "red" };
  if (days === 1) return { label: "Vence manana", cls: "amber" };
  return { label: `${days}d restantes`, cls: "blue" };
}

function teamWorkload(userId) {
  const assigned = workOrders.filter((order) => orderAssignees(order).includes(userId));
  const open = assigned.filter((order) => order.status !== "completed");
  const overdue = open.filter((order) => daysUntil(order.dueDate) < 0);
  const review = open.filter((order) => order.status === "in_review");
  return { assigned, open, overdue, review };
}

function weeklyDigestRows() {
  return internalUsers().map((user) => {
    const workload = teamWorkload(user.id);
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

  const allBrands = isAllBrandsScope();
  const brand = allBrands ? null : getBrand();
  document.documentElement.style.setProperty("--brand-color", allBrands ? "#18345d" : brand.color);
  document.getElementById("app").innerHTML = `
    <div class="workspace">
      <aside class="sidebar">
        <div class="brand-mark">
          <div class="logo">L</div>
          <div>
            <strong>Lumen</strong>
            <span>Workspace</span>
          </div>
        </div>
        <div class="selector-wrap">
          <label>Marca activa</label>
          <select class="brand-select js-brand-select">
            ${renderBrandOptions(state.currentBrandId)}
          </select>
        </div>
        <nav class="nav">
          ${visibleModules()
            .map(
              (module) => `
                <button class="nav-button ${module.key === state.currentModule ? "active" : ""}" data-module="${module.key}">
                  <span class="nav-icon">${module.icon}</span>
                  <span>${module.label}</span>
                </button>
              `,
            )
            .join("")}
        </nav>
        ${
          LAUNCH_MODE
            ? `
              <div class="launch-note">
                <strong>Lanzamiento interno</strong>
                <span>OTs, equipo, emails y dashboard. Modulos beta estacionados.</span>
              </div>
            `
            : ""
        }
        <div class="sidebar-footer">
          <div class="user-block">
            <strong>${dataState.profile?.full_name || "Giuliana Uzcategui"}</strong>
            <span>${dataState.profile?.email || "guzcategui@grupolumen.com"}</span>
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
            <button class="button-ghost small" data-module="client-portal">Portal cliente</button>
            <button class="button-ghost small">Notificaciones 6</button>
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
}

function renderLoadingScreen() {
  return `
    <main class="auth-screen">
      <section class="auth-card">
        <div class="logo">L</div>
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
        <div class="logo">L</div>
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
        <p class="small-muted">Si el usuario fue invitado, primero debe aceptar la invitacion y crear password.</p>
      </section>
    </main>
  `;
}

function renderModule() {
  const views = {
    dashboard: renderDashboard,
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
    roadmap: renderRoadmap,
    settings: renderSettings,
  };
  return views[state.currentModule]();
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
        <a class="button-ghost small" href="https://www.canva.com" target="_blank" rel="noreferrer">Canva</a>
        <button class="button-ghost small" data-module="content">Calendario</button>
        <button class="button-ghost small" data-module="assets">Assets</button>
        <button class="button-ghost small" data-module="reports">Reporte</button>
      </div>
    </section>
  `;
}

function getBrandSnapshot(brand) {
  const brandOpen = workOrders.filter((order) => order.brandId === brand.id && order.status !== "completed");
  const brandReview = contentItems.filter(
    (item) =>
      item.brandId === brand.id &&
      ["internal_review", "client_review", "changes_requested"].includes(item.status),
  );
  const brandApproved = contentItems.filter(
    (item) => item.brandId === brand.id && ["approved", "completed", "published"].includes(item.status),
  );
  const brandOverdue = brandOpen.filter((order) => daysUntil(order.dueDate) < 0);
  const completion = Math.min(100, Math.round((brandApproved.length / Math.max(brand.monthlyGoal, 1)) * 100));
  const risk = brandOverdue.length ? "red" : brandReview.length ? "amber" : brandOpen.length ? "blue" : "green";
  return {
    brand,
    open: brandOpen.length,
    review: brandReview.length,
    approved: brandApproved.length,
    overdue: brandOverdue.length,
    completion,
    risk,
  };
}

function renderAllBrandsHero() {
  const globalOpenOrders = workOrders.filter((order) => order.status !== "completed");
  const globalOverdueOrders = globalOpenOrders.filter((order) => daysUntil(order.dueDate) < 0);
  const globalReviewItems = contentItems.filter((item) =>
    ["internal_review", "client_review", "changes_requested"].includes(item.status),
  );
  const activeBrands = brands.filter((brand) => brand.isActive !== false);
  const monthlyGoal = activeBrands.reduce((sum, brand) => sum + brand.monthlyGoal, 0);
  return `
    <section class="panel all-hero">
      <div class="all-hero-copy">
        <span class="eyebrow">Vista general</span>
        <h2>Todas las marcas</h2>
        <p class="muted">Un tablero ejecutivo para ver carga, riesgos, revisiones y avance sin entrar marca por marca.</p>
        <div class="badge-row">
          <span class="badge blue">${clients.length} clientes</span>
          <span class="badge green">${activeBrands.length} marcas activas</span>
          <span class="badge amber">${monthlyGoal} piezas meta mensual</span>
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
          <strong>${globalReviewItems.length}</strong>
          <span>en revision</span>
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

function renderAllBrandsDashboard() {
  const snapshots = brands.map(getBrandSnapshot);
  const globalOpenOrders = workOrders.filter((order) => order.status !== "completed");
  const globalOverdueOrders = globalOpenOrders.filter((order) => daysUntil(order.dueDate) < 0);
  const globalReviewItems = contentItems.filter((item) =>
    ["internal_review", "client_review", "changes_requested"].includes(item.status),
  );
  const topBrands = snapshots
    .filter((row) => row.open || row.review || row.overdue)
    .sort((a, b) => b.overdue - a.overdue || b.open - a.open)
    .slice(0, 8);
  const statusRows = Object.keys(workOrderStatusLabels).map((status) => ({
    status,
    label: workOrderStatusLabels[status],
    count: workOrders.filter((order) => order.status === status).length,
  }));
  const maxStatus = Math.max(...statusRows.map((row) => row.count), 1);
  const urgentOrders = globalOpenOrders
    .slice()
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate))
    .slice(0, 6);
  const reviewItems = globalReviewItems.slice(0, 6);
  const teamRows = weeklyDigestRows()
    .sort((a, b) => b.overdue - a.overdue || b.open - a.open)
    .slice(0, 5);

  return `
    ${renderAllBrandsHero()}
    ${renderLaunchReadiness()}
    <section class="overview-layout">
      <div class="panel section visual-panel">
        <div class="section-header">
          <div>
            <h2 class="section-title">Mapa operativo por cliente</h2>
            <div class="small-muted">Click en cualquier marca para entrar a su workspace.</div>
          </div>
          <span class="badge blue">Scope global</span>
        </div>
        <div class="client-lanes">
          ${clients
            .map((clientItem) => {
              const clientSnapshots = snapshots.filter((snapshot) => snapshot.brand.clientId === clientItem.id);
              const clientOpen = clientSnapshots.reduce((sum, snapshot) => sum + snapshot.open, 0);
              const clientOverdue = clientSnapshots.reduce((sum, snapshot) => sum + snapshot.overdue, 0);
              return `
                <article class="client-lane">
                  <div class="client-lane-head">
                    <div>
                      <strong>${clientItem.name}</strong>
                      <span>${clientSnapshots.length} marcas / ${clientOpen} OTs abiertas</span>
                    </div>
                    <span class="badge ${clientOverdue ? "red" : "green"}">${clientOverdue} vencidas</span>
                  </div>
                  <div class="brand-mini-grid">
                    ${clientSnapshots.map(renderAllBrandCard).join("")}
                  </div>
                </article>
              `;
            })
            .join("")}
        </div>
      </div>
      <div class="panel section visual-panel">
        <div class="section-header">
          <h2 class="section-title">Flujo de OTs</h2>
          <button class="button-ghost small" data-module="work-orders">Ver kanban</button>
        </div>
        <div class="status-board">
          ${statusRows
            .map(
              (row) => `
                <div class="status-row">
                  <div class="row between">
                    <strong>${row.label}</strong>
                    <span>${row.count}</span>
                  </div>
                  <div class="bar-track"><div class="bar-fill" style="width:${Math.round((row.count / maxStatus) * 100)}%"></div></div>
                </div>
              `,
            )
            .join("")}
        </div>
        <div class="divider"></div>
        <div class="stack">
          <strong>Carga por responsable</strong>
          ${teamRows
            .map(({ user, open, overdue }) => {
              const load = Math.min(100, open * 18 + overdue * 22);
              return `
                <div class="team-mini-row">
                  <div>
                    <strong>${user.name}</strong>
                    <span class="muted">${open} abiertas / ${overdue} vencidas</span>
                  </div>
                  <div class="bar-track"><div class="bar-fill" style="width:${load}%"></div></div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    </section>
    <section class="grid grid-2">
      <div class="panel section">
        <div class="section-header">
          <h2 class="section-title">Marcas que necesitan atencion</h2>
          <span class="badge amber">${topBrands.length} focos</span>
        </div>
        <div class="brand-health-grid compact">
          ${topBrands.map(renderAllBrandCard).join("") || `<div class="empty">Sin focos activos</div>`}
        </div>
      </div>
      <div class="panel section">
        <div class="section-header">
          <h2 class="section-title">Urgente esta semana</h2>
          <button class="button-ghost small" data-module="notifications">Emails</button>
        </div>
        <div class="stack">
          ${urgentOrders
            .map((order) => {
              const urgency = workOrderUrgency(order);
              return `
                <div class="mini-card">
                  <div class="row between">
                    <strong>${order.id}</strong>
                    <span class="badge ${urgency.cls}">${urgency.label}</span>
                  </div>
                  <span>${order.title}</span>
                  <div class="muted">${getClient(getBrand(order.brandId).clientId).name} / ${getBrand(order.brandId).shortName}</div>
                </div>
              `;
            })
            .join("") || `<div class="empty">Sin urgencias</div>`}
        </div>
      </div>
    </section>
    <section class="grid grid-2">
      <div class="panel section">
        <div class="section-header">
          <h2 class="section-title">Madurez del workspace</h2>
          <button class="button-ghost small" data-module="settings">Plan launch</button>
        </div>
        <div class="health-list">
          ${moduleHealth
            .map(
              ([label, value, phase]) => `
                <div class="health-row">
                  <div class="row between">
                    <strong>${label}</strong>
                    <span class="muted">${phase} / ${value}%</span>
                  </div>
                  <div class="bar-track"><div class="bar-fill" style="width:${value}%"></div></div>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
      <div class="panel section">
        <div class="section-header">
          <h2 class="section-title">Modulos estacionados</h2>
          <span class="badge amber">Despues del piloto</span>
        </div>
        <div class="beta-module-grid">
          ${launchBlockedModules
            .map((module) => `<span class="badge">${module.label}</span>`)
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderDashboard() {
  if (isAllBrandsScope()) return renderAllBrandsDashboard();
  const items = brandItems();
  const orders = brandOrders();
  const pendingOrders = orders.filter((order) => order.status !== "completed").length;
  const reviewItems = items.filter((item) =>
    ["internal_review", "client_review", "changes_requested"].includes(item.status),
  ).length;
  const approvedItems = items.filter((item) => item.status === "approved").length;
  const nextProduction = relatedProductions().sort((a, b) => a.date.localeCompare(b.date))[0];

  return `
    ${renderBrandHero()}
    <section class="grid grid-4">
      ${renderMetric("OTs pendientes", pendingOrders, "Abiertas para esta marca")}
      ${renderMetric("Piezas en revision", reviewItems, "Internas y cliente")}
      ${renderMetric("Aprobadas", approvedItems, `${getBrand().monthlyGoal} piezas meta mensual`)}
      ${renderMetric("Proxima produccion", nextProduction ? formatDate(nextProduction.date) : "Ninguna", nextProduction ? nextProduction.title : "Sin llamado activo")}
    </section>
    <section class="grid grid-2">
      <div class="panel section">
        <div class="section-header">
          <h2 class="section-title">Que mejoramos ahora</h2>
          <span class="badge green">Prioridad recomendada</span>
        </div>
        <div class="stack">
          ${nextImprovements
            .map(
              (item) => `
                <div class="priority-card">
                  <div>
                    <strong>${item.title}</strong>
                    <p class="muted">${item.impact}</p>
                  </div>
                  <span class="badge blue">${item.owner}</span>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
      <div class="panel section">
        <div class="section-header">
          <h2 class="section-title">Madurez del workspace</h2>
          <button class="button-ghost small" data-module="roadmap">Roadmap</button>
        </div>
        <div class="health-list">
          ${moduleHealth
            .map(
              ([label, value, phase]) => `
                <div class="health-row">
                  <div class="row between">
                    <strong>${label}</strong>
                    <span class="muted">${phase} / ${value}%</span>
                  </div>
                  <div class="bar-track"><div class="bar-fill" style="width:${value}%"></div></div>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    </section>
    <section class="panel section">
      <div class="section-header">
        <h2 class="section-title">Plan de implementacion actualizado</h2>
        <button class="button-ghost small" data-module="roadmap">Ver roadmap completo</button>
      </div>
      <div class="phase-strip">
        ${roadmapPhases
          .map(
            (phase) => `
              <div class="phase-pill ${phase.status}">
                <strong>${phase.label}</strong>
                <span>${phase.title}</span>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
    <section class="grid grid-2">
      <div class="panel section">
        <div class="section-header">
          <h2 class="section-title">Mi semana</h2>
          <button class="button-ghost small" data-module="work-orders">Ver OTs</button>
        </div>
        <div class="stack">
          ${orders
            .slice(0, 4)
            .map(
              (order) => `
                <div class="mini-card">
                  <div class="row between">
                    <strong>${order.title}</strong>
                    <span class="badge ${order.priority === "high" ? "red" : "amber"}">${order.priority}</span>
                  </div>
                  <div class="row between muted">
                    <span>${order.id}</span>
                    <span>${formatDate(order.dueDate)}</span>
                  </div>
                </div>
              `,
            )
            .join("") || `<div class="empty">Sin tareas activas</div>`}
        </div>
      </div>
      <div class="panel section">
        <div class="section-header">
          <h2 class="section-title">Actividad reciente</h2>
          <button class="button-ghost small" data-module="content">Ver contenido</button>
        </div>
        <div class="stack">
          ${items
            .slice(0, 5)
            .map(
              (item) => `
                <div class="mini-card">
                  <div class="row between">
                    <strong>${item.title}</strong>
                    <span class="badge ${clsStatus(item.status)}">${statusLabels[item.status]}</span>
                  </div>
                  <span class="muted">${item.platform} / ${item.format} / ${formatDateTime(item.scheduledAt)}</span>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderMetric(label, value, detail) {
  return `
    <div class="metric">
      <div class="metric-label">${label}</div>
      <div class="metric-value">${value}</div>
      <div class="metric-detail">${detail}</div>
    </div>
  `;
}

function renderLaunchReadiness() {
  const doneCount = launchChecklist.filter((item) => item.status === "done").length;
  const nextCount = launchChecklist.filter((item) => item.status === "next").length;
  const pendingCount = launchChecklist.filter((item) => item.status === "pending").length;
  const percent = Math.round((doneCount / launchChecklist.length) * 100);
  const statusClass = {
    done: "green",
    next: "blue",
    pending: "amber",
  };
  const statusLabel = {
    done: "Listo",
    next: "Siguiente",
    pending: "Pendiente",
  };
  return `
    <section class="panel section launch-readiness">
      <div class="section-header">
        <div>
          <h2 class="section-title">Lanzamiento interno MVP</h2>
          <div class="small-muted">Primer release enfocado en ordenes de trabajo, equipo, adjuntos y emails.</div>
        </div>
        <div class="launch-score">
          <strong>${percent}%</strong>
          <span>preparado</span>
        </div>
      </div>
      <div class="launch-summary-grid">
        <div><strong>${doneCount}</strong><span>listos</span></div>
        <div><strong>${nextCount}</strong><span>siguientes</span></div>
        <div><strong>${pendingCount}</strong><span>pendientes</span></div>
      </div>
      <div class="launch-check-grid">
        ${launchChecklist
          .map(
            (item) => `
              <article class="launch-check-card ${item.status}">
                <div class="row between">
                  <strong>${item.title}</strong>
                  <span class="badge ${statusClass[item.status]}">${statusLabel[item.status]}</span>
                </div>
                <p class="muted">${item.detail}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderWeeklyDigestPreview() {
  const rows = weeklyDigestRows();
  return `
    <div class="email-preview">
      <div class="email-preview-header">
        <strong>${weeklyDigestConfig.subject}</strong>
        <span>${weeklyDigestConfig.day} ${weeklyDigestConfig.time}</span>
      </div>
      <div class="stack">
        ${rows
          .map(
            ({ user, open, overdue, review, collaborators, next }) => `
              <div class="digest-row">
                <div>
                  <strong>${user.name}</strong>
                  <div class="muted">${user.email}</div>
                </div>
                <div class="digest-stats">
                  <span class="badge ${overdue > 0 ? "red" : "green"}">${overdue} vencidas</span>
                  <span class="badge blue">${open} abiertas</span>
                  <span class="badge amber">${review} en revision</span>
                  <span class="badge purple">${collaborators} colaborativas</span>
                </div>
                <div class="muted">${next ? `Proxima: ${next.id} / ${formatDate(next.dueDate)}` : "Sin pendientes"}</div>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
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
            <div class="small-muted">Fase 1 / fuente de verdad / ${brand.name}</div>
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
        <p class="muted">Esta pantalla alimenta todos los demas modulos: IA, contenido, reportería, aprobaciones y portal cliente.</p>
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

function renderWorkOrders() {
  const columns = ["new", "in_progress", "in_review", "completed"];
  const orders = brandOrders();
  const openOrders = orders.filter((order) => order.status !== "completed");
  const overdueOrders = openOrders.filter((order) => daysUntil(order.dueDate) < 0);
  const emailOrders = openOrders.filter((order) => order.notifyOnEmail);
  const allBrands = isAllBrandsScope();
  return `
    ${allBrands ? renderAllBrandsHero() : renderBrandHero()}
    <section class="grid grid-4">
      ${renderMetric("OTs abiertas", openOrders.length, allBrands ? "Todas las marcas" : "No completadas")}
      ${renderMetric("Vencidas", overdueOrders.length, "Requieren seguimiento")}
      ${renderMetric("En revision", orders.filter((order) => order.status === "in_review").length, "Esperando validacion")}
      ${renderMetric("Con email activo", emailOrders.length, "Incluidas en digest")}
    </section>
    <section class="grid grid-2">
      ${
        allBrands
          ? `
            <div class="panel section">
              <div class="section-header">
                <div>
                  <h2 class="section-title">Crear OT por marca</h2>
                  <div class="small-muted">Para crear una orden, primero entra a la marca correcta desde este mapa.</div>
                </div>
                <span class="badge amber">Requiere marca</span>
              </div>
              <div class="brand-health-grid compact">
                ${brands.map((brand) => renderAllBrandCard(getBrandSnapshot(brand))).join("")}
              </div>
            </div>
          `
          : `
            <div class="panel section">
              <div class="section-header">
                <div>
                  <h2 class="section-title">Crear orden de trabajo</h2>
                  <div class="small-muted">Asignacion + email de notificacion + seguimiento semanal.</div>
                </div>
                <span class="badge blue">Foco operativo</span>
              </div>
              <div class="form-grid">
                <div class="field full">
                  <label>Titulo</label>
                  <input class="input" id="ot-title" value="Nueva solicitud para ${getBrand().shortName}" />
                </div>
                <div class="field">
                  <label>Responsables</label>
                  <select class="input multi-select" id="ot-assignees" multiple>
                    ${internalUsers()
                      .filter((user) => user.brands.includes(state.currentBrandId) || user.role === "directora")
                      .map((user) => `<option value="${user.id}">${user.name}</option>`)
                      .join("")}
                  </select>
                  <div class="field-help">Puedes seleccionar varias personas con Cmd/Ctrl o Shift.</div>
                </div>
                <div class="field">
                  <label>Deadline</label>
                  <input class="input" id="ot-due-date" type="date" value="2026-05-08" />
                </div>
                <div class="field">
                  <label>Prioridad</label>
                  <select class="input" id="ot-priority">
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="low">Baja</option>
                  </select>
                </div>
                <div class="field">
                  <label>Categoria</label>
                  <select class="input" id="ot-category">
                    <option value="diseno">Diseno</option>
                    <option value="copy">Copy</option>
                    <option value="pauta">Pauta</option>
                    <option value="produccion">Produccion</option>
                    <option value="desarrollo">Desarrollo</option>
                  </select>
                </div>
                <div class="field full">
                  <label>Descripcion</label>
                  <textarea class="textarea" id="ot-description">Contexto, entregable esperado y criterios de aprobacion.</textarea>
                </div>
                <div class="field full">
                  <label>Archivos adjuntos</label>
                  <input class="input file-input" id="ot-files" type="file" multiple />
                  <div class="field-help">En el prototipo se guarda nombre, tipo y peso. En Supabase se subira a Storage.</div>
                </div>
                <div class="full row wrap">
                  <label class="checkbox-line">
                    <input id="ot-email" type="checkbox" checked />
                    Notificar por email al asignado
                  </label>
                  <button class="button" data-action="create-work-order">Crear OT</button>
                </div>
              </div>
            </div>
          `
      }
      <div class="panel section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Digest semanal</h2>
            <div class="small-muted">${weeklyDigestConfig.day} ${weeklyDigestConfig.time} / ${weeklyDigestConfig.timezone}</div>
          </div>
          <button class="button small" data-action="preview-weekly-digest">Preparar email</button>
        </div>
        ${renderWeeklyDigestPreview()}
      </div>
    </section>
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Kanban operativo</h2>
        <div class="row wrap">
          <button class="button-ghost small" data-module="team">Ver carga equipo</button>
          <button class="button-ghost small" data-module="notifications">Reglas email</button>
        </div>
      </div>
      <div class="kanban">
        ${columns
          .map(
            (status) => `
              <div class="kanban-column">
                <h3>${workOrderStatusLabels[status]}</h3>
                ${orders
                  .filter((order) => order.status === status)
                  .map((order) => renderOrderCard(order))
                  .join("") || `<div class="empty">Sin OTs</div>`}
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderOrderCard(order) {
  const assignees = orderAssignees(order);
  const files = orderFiles(order);
  const urgency = workOrderUrgency(order);
  return `
    <div class="mini-card">
      <div class="row between">
        <span class="badge">${order.id}</span>
        <span class="badge ${order.priority === "high" ? "red" : order.priority === "medium" ? "amber" : "green"}">${order.priority}</span>
      </div>
      <strong>${order.title}</strong>
      <span class="muted">${assignees.map((userId) => userName(userId)).join(", ") || "Sin asignar"} / ${formatDate(order.dueDate)}</span>
      <span class="badge ${urgency.cls}">${urgency.label}</span>
      <p class="muted">${order.description || "Sin descripcion"}</p>
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
                .map(
                  (file) => `
                    <span class="file-chip">${file.name}</span>
                  `,
                )
                .join("")}
            </div>
          `
          : `<span class="muted">Sin archivos adjuntos</span>`
      }
      <div class="row wrap">
        ${order.notifyOnEmail ? `<span class="badge blue">Email activo</span>` : `<span class="badge">Sin email</span>`}
        <button class="button-ghost small" data-action="advance-order" data-id="${order.id}">Avanzar</button>
      </div>
      ${
        order.linkedContentId
          ? `<button class="button-ghost small" data-content="${order.linkedContentId}">Ver pieza vinculada</button>`
          : ""
      }
    </div>
  `;
}

function renderNotifications() {
  const openOrders = workOrders.filter((order) => order.status !== "completed");
  const overdueOrders = openOrders.filter((order) => daysUntil(order.dueDate) < 0);
  const dueTomorrow = openOrders.filter((order) => daysUntil(order.dueDate) === 1);
  return `
    <section class="section">
      <div class="panel brand-hero">
        <div>
          <div class="hero-title">
            <h2>Notificaciones de OTs</h2>
            <span class="badge blue">Email operativo</span>
          </div>
          <p class="muted">Reglas para avisos de asignacion, vencimientos y digest semanal del equipo. En este prototipo se prepara el email; el envio real se conecta luego por Edge Function + proveedor email.</p>
        </div>
        <div class="quick-links">
          <button class="button" data-action="preview-weekly-digest">Preparar digest lunes</button>
          <button class="button-ghost" data-module="work-orders">Ver OTs</button>
        </div>
      </div>
      <section class="grid grid-4">
        ${renderMetric("OTs monitoreadas", openOrders.length, "Abiertas en todas las marcas")}
        ${renderMetric("Vencidas", overdueOrders.length, "Incluidas como alerta roja")}
        ${renderMetric("Vencen manana", dueTomorrow.length, "Recordatorio 24h")}
        ${renderMetric("Destinatarios", internalUsers().length, "Equipo interno")}
      </section>
      <section class="grid grid-2">
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
            <h2 class="section-title">Preview digest lunes</h2>
            <button class="button-ghost small" data-action="preview-weekly-digest">Actualizar preview</button>
          </div>
          ${renderWeeklyDigestPreview()}
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
          <h2 class="section-title">Calendario de contenido dos fases</h2>
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
        <button class="button small" data-action="approve-asset" data-id="${asset.id}">Aprobar version</button>
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

function renderReports() {
  const brandReports = isAllBrandsScope() ? reports : reports.filter((report) => report.brandId === state.currentBrandId);
  const fallback = [
    { metric: "Alcance", value: 24000, trend: 7 },
    { metric: "Interacciones", value: 3160, trend: 4 },
    { metric: "CTR", value: 1.9, trend: -0.2 },
  ];
  const rows = brandReports.length ? brandReports : fallback;
  return `
    <section class="grid grid-2">
      <div class="panel section">
        <div class="section-header">
          <h2 class="section-title">Reporte mensual</h2>
          <div class="row wrap">
            <button class="button-ghost small" data-action="upload-csv">Subir CSV</button>
            <button class="button small" data-action="export-pdf">Export PDF</button>
          </div>
        </div>
        <div class="badge-row">
          <span class="badge blue">report_snapshots</span>
          <span class="badge">Carga manual v1</span>
          <span class="badge green">Cliente ve reportes aprobados</span>
        </div>
        <div class="grid grid-3">
          ${rows.map((report) => renderMetric(report.metric, report.value, `${report.trend > 0 ? "+" : ""}${report.trend}% vs periodo anterior`)).join("")}
        </div>
      </div>
      <div class="panel section">
        <h2 class="section-title">Distribucion de resultados</h2>
        <div class="bar-chart">
          ${rows
            .map(
              (report, index) => `
                <div class="bar-row">
                  <span>${report.metric}</span>
                  <div class="bar-track"><div class="bar-fill" style="width:${Math.max(18, 90 - index * 18)}%"></div></div>
                  <strong>${report.trend > 0 ? "+" : ""}${report.trend}%</strong>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
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
          <button class="button">Agregar usuario</button>
        </div>
      </div>
      <div class="grid grid-4">
        ${renderMetric("Equipo interno", teamRows.length, "Usuarios operativos")}
        ${renderMetric("OTs abiertas", workOrders.filter((order) => order.status !== "completed").length, "Todas las marcas")}
        ${renderMetric("Vencidas", workOrders.filter((order) => order.status !== "completed" && daysUntil(order.dueDate) < 0).length, "Necesitan seguimiento")}
        ${renderMetric("Digest lunes", "8:00", weeklyDigestConfig.timezone)}
      </div>
      <div class="grid grid-2">
        ${teamRows
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
                  <span class="badge blue">${roleLabels[user.role]}</span>
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
                  <span class="badge amber">${workload.review.length} revision</span>
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
          .join("")}
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Marcas</th>
              <th>Email operativo</th>
            </tr>
          </thead>
          <tbody>
            ${users
              .map(
                (user) => `
                  <tr>
                    <td>
                      <strong>${user.name}</strong>
                      <div class="muted">${user.email}</div>
                    </td>
                    <td><span class="badge ${user.role === "cliente" ? "amber" : "blue"}">${roleLabels[user.role]}</span></td>
                    <td>${user.brands.slice(0, 4).map((id) => `<span class="badge">${getBrand(id).shortName}</span>`).join(" ")}${user.brands.length > 4 ? ` <span class="badge">+${user.brands.length - 4}</span>` : ""}</td>
                    <td>${user.role === "cliente" ? "Solo portal cliente" : "Asignaciones, vencimientos, digest lunes"}</td>
                  </tr>
                `,
              )
              .join("")}
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

function renderRoadmap() {
  const totalWeeks = "9-11 semanas";
  return `
    <section class="section">
      <div class="panel brand-hero">
        <div>
          <div class="hero-title">
            <h2>Roadmap operativo</h2>
            <span class="badge blue">${totalWeeks}</span>
          </div>
          <p class="muted">Plan actualizado para construir Lumen Workspace por capas sin convertir el calendario en el centro de la plataforma.</p>
        </div>
        <div class="quick-links">
          <button class="button-ghost small" data-module="brand-config">Ir a Fase 1</button>
          <button class="button-ghost small" data-module="content">Ir a Fase 2</button>
          <button class="button-ghost small" data-module="client-portal">Ir a Fase 5</button>
        </div>
      </div>
      <div class="phase-grid">
        ${roadmapPhases
          .map(
            (phase) => `
              <article class="panel phase-card ${phase.status}">
                <div class="row between">
                  <span class="badge ${phase.status === "in_progress" ? "green" : "blue"}">${phase.label}</span>
                  <span class="muted">${phase.duration}</span>
                </div>
                <h3 class="section-title">${phase.title}</h3>
                <ul>
                  ${phase.items.map((item) => `<li>${item}</li>`).join("")}
                </ul>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderSettings() {
  if (isAllBrandsScope()) {
    return `
      <section class="section">
        ${renderLaunchReadiness()}
        <section class="grid grid-2">
          <div class="panel section">
            <div class="section-header">
              <h2 class="section-title">Plan tecnico inmediato</h2>
              <span class="badge blue">Produccion interna</span>
            </div>
            <div class="stack">
              <div class="mini-card">
                <strong>1. Ejecutar schema MVP</strong>
                <span class="muted">Usar supabase/launch_mvp.sql en el proyecto real.</span>
              </div>
              <div class="mini-card">
                <strong>2. Crear usuarios y memberships</strong>
                <span class="muted">Cada persona debe tener role y marcas asignadas antes de entrar.</span>
              </div>
              <div class="mini-card">
                <strong>3. Conectar el frontend a Supabase</strong>
                <span class="muted">OTs, responsables, comentarios, archivos y actividad dejan de ser mock.</span>
              </div>
              <div class="mini-card">
                <strong>4. Activar emails</strong>
                <span class="muted">Assignment, vencimientos y digest lunes con Edge Function.</span>
              </div>
            </div>
          </div>
          <div class="panel section">
            <div class="section-header">
              <h2 class="section-title">Modulos fuera del release 1</h2>
              <span class="badge amber">Beta</span>
            </div>
            <p class="muted">Siguen en el prototipo, pero no aparecen en la navegacion del lanzamiento interno para que el equipo se enfoque en operar OTs.</p>
            <div class="beta-module-grid">
              ${launchBlockedModules.map((module) => `<span class="badge">${module.label}</span>`).join("")}
            </div>
          </div>
        </section>
      </section>
    `;
  }
  const brand = getBrand();
  return `
    <section class="grid grid-2">
      <div class="panel section">
        <h2 class="section-title">Marca</h2>
        <div class="form-grid">
          <div class="field">
            <label>Nombre</label>
            <input class="input" value="${brand.name}" />
          </div>
          <div class="field">
            <label>Cliente</label>
            <input class="input" value="${getClient(brand.clientId).name}" />
          </div>
          <div class="field full">
            <label>Servicios activos</label>
            <input class="input" value="${brand.services.join(", ")}" />
          </div>
          <div class="field full">
            <label>Canva folder</label>
            <input class="input" value="${brand.canvaFolder}" />
          </div>
        </div>
      </div>
      <div class="panel section">
        <h2 class="section-title">Brand context IA</h2>
        <div class="form-grid">
          <div class="field full">
            <label>Tono de voz</label>
            <textarea class="textarea">Claro, util, cercano y orientado a accion.</textarea>
          </div>
          <div class="field full">
            <label>Frases prohibidas</label>
            <input class="input" value="claims no validados, exceso de hashtags" />
          </div>
          <button class="button full">Guardar configuracion</button>
        </div>
      </div>
    </section>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-module]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!canOpenModule(button.dataset.module)) {
        showToast("Modulo estacionado para despues del piloto interno");
        return;
      }
      state.currentModule = button.dataset.module;
      render();
    });
  });

  document.querySelectorAll(".js-brand-select").forEach((brandSelect) => {
    brandSelect.addEventListener("change", (event) => {
      state.currentBrandId = event.target.value;
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
        if (LAUNCH_MODE && !canOpenModule("content")) {
          showToast("Contenido queda fuera del lanzamiento interno");
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
      const firstContent = brandItems(state.currentBrandId)[0];
      state.selectedContentId = firstContent?.id || null;
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
}

function bindAuthEvents() {
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action, button.dataset.id));
  });
}

async function handleAction(action, id) {
  const actionMap = {
    login: () => loginWithPassword(),
    logout: () => logout(),
    "approve-content": () => updateContentStatus(id, "approved", "Pieza aprobada"),
    "request-changes": () =>
      updateContentStatus(id, "changes_requested", "Cambios solicitados al equipo"),
    "move-final": () => updateContentStage(id, "final", "Pieza movida a fase final"),
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
    "create-work-order": () => createWorkOrderFromForm(),
    "advance-order": () => advanceWorkOrder(id),
    "preview-weekly-digest": () => previewWeeklyDigest(),
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

async function createWorkOrderFromForm() {
  if (isAllBrandsScope()) {
    showToast("Selecciona una marca antes de crear una OT");
    return;
  }
  const title = document.getElementById("ot-title")?.value.trim();
  const assigneeSelect = document.getElementById("ot-assignees");
  const assignees = assigneeSelect
    ? Array.from(assigneeSelect.selectedOptions).map((option) => option.value)
    : [];
  const dueDate = document.getElementById("ot-due-date")?.value || "2026-05-08";
  const priority = document.getElementById("ot-priority")?.value || "medium";
  const category = document.getElementById("ot-category")?.value || "diseno";
  const description = document.getElementById("ot-description")?.value.trim();
  const notifyOnEmail = document.getElementById("ot-email")?.checked ?? true;
  const filesInput = document.getElementById("ot-files");
  const files = filesInput
    ? Array.from(filesInput.files).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
      }))
    : [];
  if (!title) {
    showToast("Agrega un titulo para crear la OT");
    return;
  }
  if (!assignees.length) {
    showToast("Selecciona al menos un responsable");
    return;
  }
  const code = `OT-${getBrand().shortName.toUpperCase().replaceAll(" ", "-")}-${String(workOrders.length + 1).padStart(3, "0")}`;

  if (isSupabaseMode()) {
    const { data: insertedOrder, error: orderError } = await supabaseClient
      .from("work_orders")
      .insert({
        code,
        brand_id: state.currentBrandId,
        title,
        status: "new",
        priority,
        category,
        due_date: dueDate,
        description,
        created_by: dataState.session?.user?.id,
        notify_on_email: notifyOnEmail,
      })
      .select()
      .single();

    if (orderError) {
      showToast(`No se pudo crear la OT: ${orderError.message}`);
      return;
    }

    if (assignees.length) {
      const { error: assigneeError } = await supabaseClient.from("work_order_assignees").insert(
        assignees.map((userId) => ({
          work_order_id: insertedOrder.id,
          user_id: userId,
          assigned_by: dataState.session?.user?.id,
        })),
      );
      if (assigneeError) {
        showToast(`OT creada, pero fallo responsables: ${assigneeError.message}`);
      }
    }

    for (const file of filesInput ? Array.from(filesInput.files) : []) {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const storagePath = `${state.currentBrandId}/${insertedOrder.id}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabaseClient.storage.from("work-order-files").upload(storagePath, file);
      if (uploadError) {
        showToast(`OT creada, pero fallo archivo: ${uploadError.message}`);
        continue;
      }
      await supabaseClient.from("work_order_files").insert({
        work_order_id: insertedOrder.id,
        storage_path: storagePath,
        file_name: file.name,
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
        uploaded_by: dataState.session?.user?.id,
      });
    }

    await supabaseClient.from("work_order_activity").insert({
      work_order_id: insertedOrder.id,
      actor_id: dataState.session?.user?.id,
      action: "created",
      details: { title, assignees: assignees.length, files: files.length },
    });

    if (notifyOnEmail) {
      const recipients = users.filter((user) => assignees.includes(user.id));
      await supabaseClient.from("email_notifications").insert(
        recipients.map((user) => ({
          brand_id: state.currentBrandId,
          work_order_id: insertedOrder.id,
          recipient_user_id: user.id,
          recipient_email: user.email,
          notification_type: "assignment",
          subject: `Nueva OT asignada: ${code}`,
          html_body: `<p>Se te asigno la orden <strong>${code}</strong>: ${escapeHtml(title)}</p>`,
          status: "queued",
        })),
      );
    }

    await loadSupabaseData();
    showToast(`OT creada en Supabase: ${code}`);
    return;
  }

  workOrders.push({
    id: code,
    brandId: state.currentBrandId,
    title,
    status: "new",
    priority,
    category,
    dueDate,
    assignee: assignees[0],
    assignees,
    description,
    files,
    createdBy: "giu",
    notifyOnEmail,
    linkedContentId: state.selectedContentId,
  });
  saveWorkOrders();
  showToast(`OT creada y ${notifyOnEmail ? "email preparado" : "sin email"}`);
}

async function advanceWorkOrder(id) {
  const order = workOrders.find((candidate) => candidate.id === id);
  if (!order) return;
  const next = {
    new: "in_progress",
    in_progress: "in_review",
    in_review: "completed",
    completed: "completed",
  };
  const nextStatus = next[order.status] || "in_progress";

  if (isSupabaseMode()) {
    const { error } = await supabaseClient
      .from("work_orders")
      .update({ status: nextStatus })
      .eq("id", order.dbId);
    if (error) {
      showToast(`No se pudo avanzar la OT: ${error.message}`);
      return;
    }
    await supabaseClient.from("work_order_activity").insert({
      work_order_id: order.dbId,
      actor_id: dataState.session?.user?.id,
      action: "status_changed",
      details: { from: order.status, to: nextStatus },
    });
    await loadSupabaseData();
    showToast(`${order.id} avanzó a ${workOrderStatusLabels[nextStatus]}`);
    return;
  }

  order.status = nextStatus;
  if (order.linkedContentId && order.status === "completed") {
    const linked = contentItems.find((item) => item.id === order.linkedContentId);
    if (linked && linked.status !== "approved") linked.status = "internal_review";
    saveContentItems();
  }
  saveWorkOrders();
  showToast(`${order.id} avanzó a ${workOrderStatusLabels[order.status]}`);
}

function previewWeeklyDigest() {
  const totalOpen = workOrders.filter((order) => order.status !== "completed").length;
  const totalOverdue = workOrders.filter((order) => order.status !== "completed" && daysUntil(order.dueDate) < 0).length;
  showToast(`Digest preparado: ${totalOpen} abiertas, ${totalOverdue} vencidas. No se envio email real.`);
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
  showToast("Calendario enviado a revision de cliente");
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
