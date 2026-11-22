// EDUCONTROL - versión de demostración en HTML, CSS y JavaScript.
// Los datos se guardan en el navegador con localStorage.
// No usar esta versión como sistema real para datos escolares privados.

const $ = id => document.getElementById(id);
const read = key => JSON.parse(localStorage.getItem(key) || "[]");
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
let currentUser = null;
let currentPage = "home";

if (!localStorage.getItem("edu_users")) {
  save("edu_users", [{id:1,name:"Administrador",username:"admin",password:"admin123",role:"admin"}]);
}
if (!localStorage.getItem("edu_subjects")) save("edu_subjects", []);
if (!localStorage.getItem("edu_grades")) save("edu_grades", []);

const menus = {
  admin: [["home","⌂","Resumen"],["professor","♙","Agregar profesor"],["student","♧","Inscribir alumno"],["subject","▤","Agregar nueva materia"]],
  professor: [["home","⌂","Resumen"],["grade","✎","Registrar calificación"]],
  student: [["home","⌂","Resumen"],["grades","▥","Mis calificaciones"]]
};

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function notify(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2600);
}
function login(username, password) {
  const user = read("edu_users").find(u => u.username === username && u.password === password);
  if (!user) throw new Error("Usuario o contraseña incorrectos.");
  currentUser = user;
  $("login").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("profileName").textContent = user.name;
  $("profileRole").textContent = {admin:"Administrador",professor:"Profesor",student:"Alumno"}[user.role];
  $("avatar").textContent = user.name.charAt(0).toUpperCase();
  buildMenu();
  render("home");
}
function buildMenu() {
  $("menu").innerHTML = menus[currentUser.role].map(([id,icon,label]) =>
    `<button data-page="${id}"><span>${icon}</span> <span class="nav-label">${label}</span></button>`
  ).join("");
  $("menu").querySelectorAll("button").forEach(button =>
    button.addEventListener("click", () => render(button.dataset.page))
  );
}
function render(page) {
  currentPage = page;
  $("menu").querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  const titles = {home:"Resumen",professor:"Agregar profesor",student:"Inscribir alumno",subject:"Agregar nueva materia",grade:"Registrar calificación",grades:"Mis calificaciones"};
  $("pageTitle").textContent = titles[page] || "Resumen";
  ({home,professor:professorPage,student:studentPage,subject:subjectPage,grade:gradePage,grades:gradesPage}[page] || home)();
}
function home() {
  const descriptions = {
    admin:"Administra profesores, alumnos y materias de tu institución.",
    professor:"Registra y administra las calificaciones de tus alumnos.",
    student:"Consulta tus calificaciones de forma personal."
  };
  $("content").innerHTML = `
    <div class="welcome"><h2>¡Hola, ${escapeHTML(currentUser.name)}!</h2><p>${descriptions[currentUser.role]}</p></div>
    <div class="stats">
      <div class="stat"><span>Tu cuenta</span><strong>${currentUser.role==="admin"?"Administrador":currentUser.role==="professor"?"Profesor":"Alumno"}</strong></div>
      <div class="stat"><span>Materias registradas</span><strong>${read("edu_subjects").length}</strong></div>
      <div class="stat"><span>Estado del sistema</span><strong>Activo</strong></div>
    </div>
    <section class="panel"><h3>Accesos disponibles</h3><p class="sub">Las opciones visibles dependen de tu tipo de usuario.</p>
    ${menus[currentUser.role].filter(x=>x[0]!=="home").map(x=>`<span class="pill" style="margin:4px">${x[2]}</span>`).join("")}</section>`;
}
function formPanel(title, description, fields, button, callback) {
  $("content").innerHTML = `<section class="panel"><h3>${title}</h3><p class="sub">${description}</p><form id="dataForm"><div class="form-grid">${fields}</div><div class="actions"><button class="btn primary">${button}</button></div></form></section>`;
  $("dataForm").addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { callback(data); event.currentTarget.reset(); }
    catch (error) { notify(error.message); }
  });
}
function field(label,name,placeholder,type="text") {
  return `<label class="field">${label}<input name="${name}" type="${type}" placeholder="${placeholder}" required></label>`;
}
function createAccount(role, data) {
  const users = read("edu_users");
  if (users.some(u => u.username.toLowerCase() === data.username.trim().toLowerCase())) throw new Error("Ese usuario ya existe.");
  if (data.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
  users.push({id:Date.now(),name:data.name.trim(),username:data.username.trim(),password:data.password,role});
  save("edu_users",users);
  notify(role==="professor"?"Profesor agregado correctamente.":"Alumno inscrito correctamente.");
}
function professorPage() {
  formPanel("Registrar profesor","Crea una cuenta para un nuevo docente.",
    field("Nombre completo","name","Ej. María López")+field("Nombre de usuario","username","Ej. maria.lopez")+field("Contraseña","password","Mínimo 6 caracteres","password"),
    "Agregar profesor",d=>createAccount("professor",d));
}
function studentPage() {
  formPanel("Inscribir alumno","Registra al estudiante y crea sus datos de acceso.",
    field("Nombre completo","name","Ej. Carlos Hernández")+field("Nombre de usuario","username","Ej. carlos.h")+field("Contraseña","password","Mínimo 6 caracteres","password"),
    "Inscribir alumno",d=>createAccount("student",d));
}
function subjectPage() {
  formPanel("Agregar nueva materia","Añade una asignatura al catálogo escolar.",
    field("Nombre de la materia","name","Ej. Matemáticas")+field("Clave de la materia","code","Ej. MAT101"),
    "Guardar materia",d=>{
      const subjects=read("edu_subjects");
      if(subjects.some(s=>s.code.toLowerCase()===d.code.trim().toLowerCase())) throw new Error("Esa clave ya está registrada.");
      subjects.push({id:Date.now(),name:d.name.trim(),code:d.code.trim().toUpperCase()});
      save("edu_subjects",subjects); notify("Materia agregada correctamente.");
    });
}
function gradePage() {
  const students=read("edu_users").filter(u=>u.role==="student");
  const subjects=read("edu_subjects");
  if(!students.length || !subjects.length) {
    $("content").innerHTML='<section class="panel empty">Primero registra al menos un alumno y una materia.</section>'; return;
  }
  $("content").innerHTML=`<section class="panel"><h3>Registrar calificación</h3><p class="sub">Elige al alumno, materia, periodo y calificación (0 a 10).</p>
  <form id="gradeForm"><div class="form-grid">
    <label class="field">Alumno<select name="studentId" required>${students.map(s=>`<option value="${s.id}">${escapeHTML(s.name)}</option>`).join("")}</select></label>
    <label class="field">Materia<select name="subjectId" required>${subjects.map(s=>`<option value="${s.id}">${escapeHTML(s.name)}</option>`).join("")}</select></label>
    ${field("Calificación","grade","Ej. 9.5","number")}
    ${field("Periodo","period","Ej. Semestre 1 - 2026")}
  </div><div class="actions"><button class="btn primary">Guardar calificación</button></div></form></section>`;
  $("grade").min="0"; $("grade").max="10"; $("grade").step="0.1";
  $("gradeForm").elements.grade.min="0"; $("gradeForm").elements.grade.max="10"; $("gradeForm").elements.grade.step="0.1";
  $("gradeForm").addEventListener("submit",e=>{
    e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries());
    const value=Number(d.grade);
    if(!Number.isFinite(value)||value<0||value>10){notify("La calificación debe estar entre 0 y 10.");return;}
    const grades=read("edu_grades");
    const existing=grades.find(g=>g.studentId===Number(d.studentId)&&g.subjectId===Number(d.subjectId)&&g.period===d.period.trim());
    if(existing) existing.grade=value;
    else grades.push({id:Date.now(),studentId:Number(d.studentId),subjectId:Number(d.subjectId),professorId:currentUser.id,grade:value,period:d.period.trim()});
    save("edu_grades",grades);notify("Calificación guardada correctamente.");e.currentTarget.reset();
  });
}
function gradesPage() {
  // Filtra usando el ID del alumno que inició sesión.
  const myGrades=read("edu_grades").filter(g=>g.studentId===currentUser.id);
  const subjects=read("edu_subjects");
  $("content").innerHTML=`<section class="panel"><h3>Mis calificaciones</h3><p class="sub">Solo se muestran tus resultados académicos.</p>
  ${myGrades.length?`<div class="table-wrap"><table><thead><tr><th>Materia</th><th>Clave</th><th>Periodo</th><th>Calificación</th><th>Estado</th></tr></thead><tbody>
  ${myGrades.map(g=>{const s=subjects.find(x=>x.id===g.subjectId)||{name:"Materia eliminada",code:"—"};return `<tr><td><b>${escapeHTML(s.name)}</b></td><td>${escapeHTML(s.code)}</td><td>${escapeHTML(g.period)}</td><td><b>${Number(g.grade).toFixed(1)}</b></td><td><span class="pill">${g.grade>=6?"Acreditada":"No acreditada"}</span></td></tr>`}).join("")}
  </tbody></table></div>`:'<div class="empty">Todavía no tienes calificaciones registradas.</div>'}</section>`;
}
$("loginForm").addEventListener("submit",e=>{
  e.preventDefault();$("loginMessage").textContent="";
  try{login($("username").value.trim(),$("password").value);}
  catch(error){$("loginMessage").textContent=error.message;}
});
$("logout").addEventListener("click",()=>{
  currentUser=null;$("app").classList.add("hidden");$("login").classList.remove("hidden");$("loginForm").reset();
});
