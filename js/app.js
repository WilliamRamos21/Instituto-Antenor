/* Sistema de Admisión · IESTP "Antenor Orrego Espinoza"
   Maqueta web estática del Home. Los datos son de demostración. */
(function () {
  "use strict";

  /* ---------- Datos (Propuesta técnica, secciones 3.1 y 5) ---------- */
  var PROCESO = { codigo: "ADM-2027-I", estado: "Inscripción" };
  var USUARIO = { nombre: "William Ramos" };

  var MODULOS = [
    { id: "usuarios", nombre: "Seguridad y Usuarios", icono: "shield",
      desc: "Cuentas, roles, permisos y auditoría de acceso.",
      funciones: ["Crear, editar y deshabilitar cuentas de usuario", "Asignar roles y permisos",
                  "Restablecer contraseñas y ver el registro de auditoría"] },
    { id: "registro", nombre: "Registro de Postulantes", icono: "userplus",
      desc: "Datos personales, fotografía, especialidad y modalidad.",
      funciones: ["Validación de DNI / Pasaporte / Carnet de Extranjería",
                  "Selección de especialidad (7) y turno (Diurno / Nocturno)",
                  "Captura de fotografía con previsualización",
                  "Modalidad: Ordinario o Ingreso Directo"] },
    { id: "pagos", nombre: "Pagos y Expedientes", icono: "check",
      desc: "Vouchers del Banco de la Nación y documentos requisito.",
      funciones: ["Revisión de vouchers (monto, operación, fecha, imagen)",
                  "Visor de documentos adjuntos",
                  "Marcar expedientes como Completos u Observados"] },
    { id: "aulas", nombre: "Control de Aulas", icono: "door",
      desc: "Grupos de 30 postulantes y listas de asistencia.",
      funciones: ["Asignación automática en aulas de máximo 30", "Criterio de agrupación configurable",
                  "Padrón por aula para el evaluador"] },
    { id: "puntajes", nombre: "Puntajes y Méritos", icono: "trophy",
      desc: "Digitación de notas y Cuadro de Méritos oficial.",
      funciones: ["Digitación rápida por aula o por código de postulante",
                  "Bonificaciones por ley aplicadas automáticamente",
                  "Cuadro de Méritos con condición Ingresante / No ingresante"] },
    { id: "reportes", nombre: "Consultas y Reportes", icono: "chart",
      desc: "Búsquedas, fichas de inscripción y exportación PDF/Excel.",
      funciones: ["Búsqueda avanzada multi-criterio",
                  "Ficha del postulante, padrones y cuadro de méritos",
                  "Exportación a PDF y Microsoft Excel"] }
  ];

  var ROLES = {
    ADMIN:     { nombre: "Administrador del Sistema", corto: "Administrador",
                 modulos: ["usuarios", "registro", "pagos", "aulas", "puntajes", "reportes"] },
    OPERADOR:  { nombre: "Operador de Admisión / Registro", corto: "Operador",
                 modulos: ["registro", "pagos"] },
    COMISION:  { nombre: "Comisión de Admisión / Docente Evaluador", corto: "Comisión",
                 modulos: ["aulas", "puntajes"] },
    DIRECTIVO: { nombre: "Directivo / Auditor", corto: "Directivo", modulos: ["reportes"] }
  };

  var ESPECIALIDADES = window.DATOS.CARRERAS.map(function (c) {
    return [c.corto, c.d, c.n, c.vd, c.vn];
  });
  var AULAS = [["AULA-101", 30], ["AULA-102", 28], ["AULA-103", 30], ["AULA-104", 17], ["LAB-ASTI-01", 9]];
  var CAPACIDAD = 30;
  var VERIFICADOS = 371;
  var PENDIENTES = [["Vouchers por verificar", 38, "pagos"], ["Expedientes observados", 12, "pagos"],
                    ["Postulantes sin aula", 54, "aulas"]];

  /* ---------- Iconos (SVG en línea) ---------- */
  var ICONOS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    userplus: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7"/><path d="M19 8v6M16 11h6"/>',
    check: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 12l3 3 5-6"/>',
    door: '<path d="M5 21V4a1 1 0 011-1h12a1 1 0 011 1v17"/><path d="M3 21h18"/><circle cx="15" cy="12" r=".8"/>',
    trophy: '<path d="M8 4h8v6a4 4 0 01-8 0z"/><path d="M8 6H4v2a4 4 0 004 4M16 6h4v2a4 4 0 01-4 4"/><path d="M12 14v4M8 21h8"/>',
    chart: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-8"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c3 0 5 2 5 5"/>',
    verified: '<path d="M12 2l2.4 2 3.1-.3 1 3 2.6 1.8-1 3 1 3-2.6 1.8-1 3-3.1-.3L12 22l-2.4-2-3.1.3-1-3L2.9 15.5l1-3-1-3L5.5 7.7l1-3 3.1.3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    school: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
    ok: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>'
  };
  function ico(n) {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (ICONOS[n] || "") + "</svg>";
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Estado ---------- */
  var rol = "ADMIN";
  try { var g = sessionStorage.getItem("rol"); if (ROLES[g]) rol = g; } catch (e) {}

  function vistaActual() {
    var v = (location.hash || "#/home").replace("#/", "");
    return v === "home" || modulosDelRol().indexOf(v) !== -1 ? v : "home";
  }
  function modulosDelRol() { return ROLES[rol].modulos; }
  function modulo(id) { return MODULOS.filter(function (m) { return m.id === id; })[0]; }

  /* ---------- Piezas de la interfaz ---------- */
  function pillsHTML(cls) {
    return Object.keys(ROLES).map(function (id) {
      return '<button class="pill' + (id === rol ? " active" : "") + '" data-rol="' + id + '">' +
             esc(ROLES[id].corto) + "</button>";
    }).join("");
  }

  function renderChrome(vista) {
    document.getElementById("rolePills").innerHTML = pillsHTML();
    document.getElementById("rolePillsM").innerHTML = pillsHTML();
    var items = '<button class="nav-item' + (vista === "home" ? " active" : "") +
                '" data-go="home">' + ico("home") + "<span>Inicio</span></button>";
    modulosDelRol().forEach(function (id) {
      var m = modulo(id);
      items += '<button class="nav-item' + (vista === id ? " active" : "") + '" data-go="' + id + '">' +
               ico(m.icono) + "<span>" + esc(m.nombre) + "</span></button>";
    });
    document.getElementById("nav").innerHTML = items;
    document.getElementById("avatar").textContent = USUARIO.nombre.charAt(0);
    document.getElementById("userName").textContent = USUARIO.nombre;
    document.getElementById("userRole").textContent = ROLES[rol].corto;
  }

  function kpi(titulo, valor, detalle, icono, clase) {
    return '<div class="card kpi ' + clase + '"><div class="badge">' +
           ico(icono) + '</div><div><div class="label">' + titulo + '</div><div class="value">' + valor +
           '</div><div class="detail">' + detalle + "</div></div></div>";
  }

  function carrerasHTML() {
    var puede = modulosDelRol().indexOf("registro") !== -1;
    var cards = window.DATOS.CARRERAS.map(function (c) {
      function fila(nom, ins, vac) {
        return '<div class="turno"><span class="tn">' + nom + "</span><span><b>" + ins + "</b> postulantes</span><span><b>" +
               vac + "</b> vacantes</span></div>";
      }
      return '<article class="carrera" style="--c:' + c.color + '"><div class="c-top"><span class="c-code">' + c.codigo +
        "</span><span class=\"c-tot\">" + (c.d + c.n) + " postulantes</span></div><h3>" + esc(c.nombre) + "</h3>" +
        fila("Diurno", c.d, c.vd) + fila("Nocturno", c.n, c.vn) +
        (puede ? '<button class="c-btn" data-inscribir="' + c.codigo + '">Inscribir postulante &rsaquo;</button>' : "") +
        "</article>";
    }).join("");
    return '<section class="section"><h2>Especialidades</h2><div class="sub">Las 7 especialidades del instituto, en turno diurno y nocturno</div>' +
           '<div class="carreras">' + cards + "</div></section>";
  }

  function homeHTML() {
    var total = 0, vac = 0, max = 0;
    ESPECIALIDADES.forEach(function (e) {
      total += e[1] + e[2]; vac += e[3] + e[4]; max = Math.max(max, e[1], e[2]);
    });
    var llenas = AULAS.filter(function (a) { return a[1] >= CAPACIDAD; }).length;
    var pct = Math.round(100 * VERIFICADOS / total);

    var banner =
      '<section class="hero"><img class="hero-img" src="assets/banner.jpg" alt="#SomosOrrego - IESTP Antenor Orrego Espinoza">' +
      '<div class="hero-body"><div><h1>Bienvenido, ' + esc(USUARIO.nombre) + "</h1>" +
      "<p>" + esc(ROLES[rol].nombre) + "</p></div>" +
      '<div class="chips"><span class="chip gold">Proceso ' + PROCESO.codigo + "</span>" +
      '<span class="chip soft">Etapa: ' + PROCESO.estado + "</span></div></div></section>";

    var kpis = '<section class="kpis">' +
      kpi("Total registrados", total, "postulantes en el proceso", "people", "k-blue") +
      kpi("Vouchers verificados", VERIFICADOS, pct + "% del total", "verified", "k-green") +
      kpi("Aulas llenas", llenas + "/" + AULAS.length, "capacidad de 30 por aula", "door", "k-orange") +
      kpi("Vacantes ofertadas", vac, "7 especialidades · 2 turnos", "school", "k-gold") +
      "</section>";

    var filas = ESPECIALIDADES.map(function (e) {
      return '<div class="chart-row"><div class="name">' + esc(e[0]) + '</div><div class="bars">' +
        '<div class="bar"><div class="track"><div class="fill" style="width:' + (e[1] / max * 100) +
        '%;background:var(--navy)"></div></div>' + e[1] + "</div>" +
        '<div class="bar"><div class="track"><div class="fill" style="width:' + (e[2] / max * 100) +
        '%;background:var(--gold)"></div></div>' + e[2] + "</div></div></div>";
    }).join("");
    var grafico = '<div class="card"><h2>Postulantes por especialidad y turno</h2>' +
      '<div class="legend"><span><i style="background:var(--navy)"></i>Diurno</span>' +
      '<span><i style="background:var(--gold)"></i>Nocturno</span></div>' + filas + "</div>";

    var aulas = AULAS.map(function (a) {
      var llena = a[1] >= CAPACIDAD;
      return '<div class="aula"><div class="aula-head"><span>' + a[0] + "</span><span>" + a[1] + "/" +
        CAPACIDAD + '</span></div><div class="track sm"><div class="fill" style="width:' +
        (a[1] / CAPACIDAD * 100) + "%;background:" + (llena ? "var(--warn)" : "var(--ok)") + '"></div></div></div>';
    }).join("");
    var pend = PENDIENTES.map(function (p) {
      var permitido = modulosDelRol().indexOf(p[2]) !== -1;
      return '<button class="pend"' + (permitido ? ' data-go="' + p[2] + '"' : " disabled") + "><b>" + p[1] +
             "</b><span>" + p[0] + "</span>&rsaquo;</button>";
    }).join("");
    var lateral = '<div class="stack"><div class="card"><h2>Estado de aulas</h2><div class="sub">Capacidad máxima: 30</div>' +
      aulas + '</div><div class="card"><h2>Pendientes de atención</h2>' + pend + "</div></div>";

    var COLORES = { usuarios: "#7C3AED", registro: "#2563EB", pagos: "#059669",
                    aulas: "#EA580C", puntajes: "#D97706", reportes: "#DB2777" };
    var accesos = modulosDelRol().map(function (id) {
      var m = modulo(id);
      return '<button class="mod" style="--c:' + COLORES[id] + '" data-go="' + id + '"><div class="badge">' + ico(m.icono) +
             "</div><strong>" + esc(m.nombre) + "</strong><span>" + esc(m.desc) + "</span></button>";
    }).join("");

    return banner + kpis + '<div class="row">' + grafico + lateral + "</div>" +
      carrerasHTML() +
      '<section class="section"><h2>Accesos rápidos</h2><div class="sub">Módulos disponibles para el perfil «' +
      esc(ROLES[rol].corto) + '»</div><div class="modules">' + accesos + "</div></section>" +
      '<p class="note">Datos de demostración: se reemplazarán por datos reales de la base de datos.</p>';
  }

  function moduloHTML(id) {
    var m = modulo(id);
    var f = m.funciones.map(function (t) { return "<li>" + ico("ok") + "<span>" + esc(t) + "</span></li>"; }).join("");
    return '<div class="mod-head"><div class="badge">' + ico(m.icono) + "</div><div><h1>" + esc(m.nombre) +
      "</h1><p>" + esc(m.desc) + '</p></div></div><div class="card"><span class="tag">En construcción · próxima etapa</span>' +
      "<h2>Funciones previstas (según la propuesta técnica)</h2><ul class=\"feat\">" + f + "</ul></div>";
  }

  /* ---------- Render y eventos ---------- */
  function render() {
    var v = vistaActual();
    renderChrome(v);
    var cont = document.getElementById("content");
    if (v === "registro") { cont.innerHTML = ""; window.Registro.render(cont); }
    else { cont.innerHTML = v === "home" ? homeHTML() : moduloHTML(v); cont.onclick = cont.oninput = cont.onchange = null; }
    document.getElementById("sidebar").classList.remove("open");
  }

  document.addEventListener("click", function (e) {
    var r = e.target.closest("[data-rol]");
    if (r) {
      rol = r.getAttribute("data-rol");
      try { sessionStorage.setItem("rol", rol); } catch (x) {}
      location.hash = "#/home";
      render();
      return;
    }
    var ins = e.target.closest("[data-inscribir]");
    if (ins) {
      try { sessionStorage.setItem("espSel", ins.getAttribute("data-inscribir")); } catch (x) {}
      if (location.hash === "#/registro") { render(); } else { location.hash = "#/registro"; }
      return;
    }
    var g = e.target.closest("[data-go]");
    if (g && !g.disabled) { location.hash = "#/" + g.getAttribute("data-go"); }
  });
  document.getElementById("menuBtn").addEventListener("click", function () {
    document.getElementById("sidebar").classList.toggle("open");
  });
  window.addEventListener("hashchange", render);
  render();
})();
