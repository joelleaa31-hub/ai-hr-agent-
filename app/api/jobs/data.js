// app/api/jobs/data.js
export const JOBS = [
  // Engineering
  { id:"fe-001", title:"Frontend Engineer", department:"Engineering", location:"Remote — Paris/Beirut", type:"Full-time",
    skills:["react","typescript","css","nextjs"], description:"Build delightful web experiences with React/Next.js.", applyUrl:"#apply-frontend" },
  { id:"be-004", title:"Backend Engineer (Node)", department:"Engineering", location:"Hybrid — Berlin", type:"Full-time",
    skills:["node","postgres","aws","rest"], description:"Design scalable APIs and data pipelines.", applyUrl:"#apply-be" },
  { id:"se-005", title:"Site Reliability Engineer", department:"Engineering", location:"Remote — Lisbon", type:"Full-time",
    skills:["kubernetes","terraform","observability"], description:"Keep systems fast, safe, and reliable.", applyUrl:"#apply-sre" },

  // Data
  { id:"ds-002", title:"Data Scientist", department:"Data", location:"Remote — London", type:"Full-time",
    skills:["python","ml","sql","pandas"], description:"Own ML models end-to-end and deliver insights.", applyUrl:"#apply-ds" },
  { id:"de-006", title:"Data Engineer", department:"Data", location:"Dubai (Onsite/Hybrid)", type:"Full-time",
    skills:["spark","airflow","dbt","sql"], description:"Build robust data pipelines and marts.", applyUrl:"#apply-de" },

  // Product / Design
  { id:"pm-003", title:"Product Manager", department:"Product", location:"Hybrid — Dubai", type:"Full-time",
    skills:["roadmaps","discovery","analytics"], description:"Lead discovery and delivery with cross-functional teams.", applyUrl:"#apply-pm" },
  { id:"ux-007", title:"Senior Product Designer", department:"Design", location:"Paris (Hybrid)", type:"Full-time",
    skills:["figma","ux research","prototyping"], description:"Craft elegant end-to-end product experiences.", applyUrl:"#apply-ux" },

  // Go-To-Market
  { id:"sa-008", title:"Sales Associate (EMEA)", department:"Sales", location:"Remote — EMEA", type:"Full-time",
    skills:["outbound","crm","discovery"], description:"Grow pipeline and close deals across EMEA.", applyUrl:"#apply-sales" },
  { id:"cs-009", title:"Customer Success Manager", department:"CS", location:"Remote — MENA", type:"Full-time",
    skills:["onboarding","adoption","upsell"], description:"Drive value and retention for key accounts.", applyUrl:"#apply-csm" }
];
