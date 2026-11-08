/* Módulo Registro de Postulantes (Propuesta técnica, sección 6.2).
   Maqueta: los datos se guardan SOLO en este navegador (localStorage).
   No se envía nada a ningún servidor. */
(function () {
  "use strict";

  var KEY = "admision_demo_postulantes_v1";
  var PROCESO = "ADM-2027-I", ANIO = 2027, MAX_MB = 5;
  var CARRERAS = window.DATOS.CARRERAS;

  var TIPOS = { DNI: "DNI", PASAPORTE: "Pasaporte", CARNET_EXTRANJERIA: "Carné de extranjería" };
  var DIRECTO = {
    PRIMER_PUESTO: "Primeros puestos", DEPORTISTA_CALIFICADO: "Deportista calificado",
    PIR: "Beneficiario PIR", CONADIS: "CONADIS", MILITAR_ACTIVO: "Servicio militar activo"
  };
  var DIRECTO_DOC = {
    PRIMER_PUESTO: "Constancia de primeros puestos",
    DEPORTISTA_CALIFICADO: "Constancia de deportista calificado",
    PIR: "Constancia de beneficiario PIR",
    CONADIS: "Certificado / carné CONADIS",
    MILITAR_ACTIVO: "Constancia de servicio militar activo"
  };
  var PASOS = ["Datos personales", "Especialidad y turno", "Pago", "Documentos y modalidad"];

  var root, mode = "lista", step = 1, d = {}, files = {}, errors = {}, foto = "", ficha = null, filtro = "";

  /* ---------- utilidades ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function cargar() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function guardar(l) { try { localStorage.setItem(KEY, JSON.stringify(l)); return true; } catch (e) { return false; } }
  function carrera(cod) { return CARRERAS.filter(function (c) { return c.codigo === cod; })[0]; }
  function hoy() { return new Date().toISOString().slice(0, 10); }
  function fmtFecha(s) { return s ? s.split("-").reverse().join("/") : ""; }
  function nuevo() {
    d = { tipo_documento: "DNI", sexo: "", turno: "", id_carrera: "", modalidad: "ORDINARIO", subtipo: "" };
    files = {}; errors = {}; foto = ""; step = 1;
    try { var pre = sessionStorage.getItem("espSel"); if (pre && carrera(pre)) d.id_carrera = pre; sessionStorage.removeItem("espSel"); } catch (e) {}
  }
  function docsRequeridos() {
    var idn = d.tipo_documento === "DNI" ? "Copia de DNI" :
              d.tipo_documento === "PASAPORTE" ? "Copia de pasaporte" : "Copia de carné de extranjería";
    var l = [{ k: "doc_identidad", t: idn }, { k: "certificado", t: "Certificado de estudios" },
             { k: "partida", t: "Partida de nacimiento" }];
    if (d.modalidad === "INGRESO_DIRECTO" && d.subtipo) l.push({ k: "especial", t: DIRECTO_DOC[d.subtipo] });
    return l;
  }
  function renderKeep() { var y = window.scrollY; render(); window.scrollTo(0, y); }

  /* ---------- campos ---------- */
  function err(id) { return errors[id] ? '<em class="err">' + esc(errors[id]) + "</em>" : ""; }
  function inp(id, label, type, o) {
    o = o || {};
    var v = d[id] == null ? "" : d[id];
    return '<label class="field' + (o.full ? " full" : "") + (errors[id] ? " bad" : "") + '"><span>' + label +
      (o.opt ? " <small>(opcional)</small>" : " <b>*</b>") + '</span><input data-f="' + id + '" type="' + type +
      '" value="' + esc(v) + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : "") + (o.attrs || "") +
      ' autocomplete="off">' + err(id) + "</label>";
  }
  function sel(id, label, opts, o) {
    o = o || {};
    var h = '<label class="field' + (o.full ? " full" : "") + (errors[id] ? " bad" : "") + '"><span>' + label +
      ' <b>*</b></span><select data-f="' + id + '"' + (o.re ? ' data-re="1"' : "") + ">";
    if (!o.noEmpty) h += '<option value="">Seleccione…</option>';
    opts.forEach(function (p) {
      h += '<option value="' + esc(p[0]) + '"' + (d[id] === p[0] ? " selected" : "") + ">" + esc(p[1]) + "</option>";
    });
    return h + "</select>" + err(id) + "</label>";
  }
  function fileField(key, label, req, accept) {
    var tiene = files[key];
    return '<div class="filerow' + (errors[key] ? " bad" : "") + '"><div class="fl"><strong>' + esc(label) +
      (req ? " <b>*</b>" : "") + "</strong><small>" +
      (tiene ? "✔ " + esc(tiene) : "JPG, PNG o PDF · máx. " + MAX_MB + " MB") + "</small>" + err(key) +
      '</div><label class="btn ghost sm">' + (tiene ? "Cambiar" : "Adjuntar") +
      '<input type="file" hidden data-file="' + key + '" accept="' + accept + '"></label></div>';
  }

  /* ---------- pasos ---------- */
  function paso1() {
    return '<div class="grid-form">' +
      sel("tipo_documento", "Tipo de documento", Object.keys(TIPOS).map(function (k) { return [k, TIPOS[k]]; }),
          { re: 1, noEmpty: 1 }) +
      inp("numero_documento", "Número de documento", "text",
          { ph: d.tipo_documento === "DNI" ? "8 dígitos" : "6 a 12 caracteres", attrs: ' inputmode="' + (d.tipo_documento === "DNI" ? "numeric" : "text") + '"' }) +
      inp("nombres", "Nombres", "text", { full: 1 }) +
      inp("apellido_paterno", "Apellido paterno", "text") +
      inp("apellido_materno", "Apellido materno", "text", { opt: 1 }) +
      inp("fecha_nacimiento", "Fecha de nacimiento", "date", { attrs: ' max="' + hoy() + '" min="1940-01-01"' }) +
      sel("sexo", "Sexo", [["M", "Masculino"], ["F", "Femenino"]]) +
      inp("telefono", "Teléfono / celular", "tel", { ph: "9 dígitos", attrs: ' inputmode="numeric"' }) +
      inp("email", "Correo electrónico", "email", { opt: 1, ph: "correo@ejemplo.com" }) +
      inp("direccion", "Dirección actual", "text", { full: 1 }) +
      "</div>" +
      '<div class="photo-box' + (errors.foto ? " bad" : "") + '"><div class="photo">' +
      (foto ? '<img src="' + foto + '" alt="Fotografía del postulante">' : "<span>Sin foto</span>") + "</div>" +
      '<div class="fl"><strong>Fotografía del postulante <b>*</b></strong><small>Fondo claro, rostro visible. JPG o PNG · máx. ' +
      MAX_MB + " MB</small>" + err("foto") +
      '<label class="btn ghost sm" style="margin-top:8px">' + (foto ? "Cambiar foto" : "Subir foto") +
      '<input type="file" hidden data-file="foto" accept="image/jpeg,image/png"></label></div></div>' +
      (d.tipo_documento !== "DNI" ? '<p class="hint">Se registrará como postulante <b>extranjero</b>.</p>' : "");
  }

  function paso2() {
    var cards = CARRERAS.map(function (c) {
      var on = d.id_carrera === c.codigo;
      return '<label class="opt' + (on ? " on" : "") + '" style="--c:' + c.color + '"><input type="radio" name="id_carrera" value="' +
        c.codigo + '" data-f="id_carrera" data-re="1"' + (on ? " checked" : "") + '><span class="code">' + c.codigo +
        "</span><strong>" + esc(c.nombre) + "</strong><small>Vacantes: " + c.vd + " diurno · " + c.vn + " nocturno</small></label>";
    }).join("");
    var turnos = [["DIURNO", "Diurno"], ["NOCTURNO", "Nocturno"]].map(function (t) {
      var on = d.turno === t[0];
      return '<label class="opt small' + (on ? " on" : "") + '"><input type="radio" name="turno" value="' + t[0] +
        '" data-f="turno" data-re="1"' + (on ? " checked" : "") + "><strong>" + t[1] + "</strong></label>";
    }).join("");
    return '<h3 class="sub-h">Especialidad <b>*</b></h3>' + (errors.id_carrera ? err("id_carrera") : "") +
      '<div class="opt-grid">' + cards + '</div><h3 class="sub-h">Turno <b>*</b></h3>' + (errors.turno ? err("turno") : "") +
      '<div class="opt-grid two">' + turnos + "</div>";
  }

  function paso3() {
    return '<p class="hint">Pago realizado en el <b>Banco de la Nación</b>. Registre los datos que figuran en el voucher.</p>' +
      '<div class="grid-form">' +
      inp("numero_operacion", "Número de operación", "text", { attrs: ' maxlength="30"' }) +
      inp("monto", "Importe (S/)", "number", { ph: "0.00", attrs: ' step="0.01" min="0.01" inputmode="decimal"' }) +
      inp("fecha_pago", "Fecha del pago", "date", { attrs: ' max="' + hoy() + '"' }) +
      "</div>" + fileField("voucher", "Imagen del voucher", true, "image/jpeg,image/png,application/pdf");
  }

  function paso4() {
    var directo = d.modalidad === "INGRESO_DIRECTO";
    var mod = [["ORDINARIO", "Ordinario", "Rinde el examen de admisión"],
               ["INGRESO_DIRECTO", "Ingreso directo", "Primeros puestos, deportistas calificados, PIR, CONADIS, servicio militar"]]
      .map(function (m) {
        var on = d.modalidad === m[0];
        return '<label class="opt' + (on ? " on" : "") + '"><input type="radio" name="modalidad" value="' + m[0] +
          '" data-f="modalidad" data-re="1"' + (on ? " checked" : "") + "><strong>" + m[1] + "</strong><small>" + m[2] + "</small></label>";
      }).join("");
    var h = '<h3 class="sub-h">Modalidad de ingreso</h3><div class="opt-grid two">' + mod + "</div>";
    if (directo) {
      h += '<div class="grid-form">' + sel("subtipo", "Tipo de ingreso directo",
        Object.keys(DIRECTO).map(function (k) { return [k, DIRECTO[k]]; }), { re: 1, full: 1 }) + "</div>";
    }
    h += '<h3 class="sub-h">Documentos requisito</h3>';
    docsRequeridos().forEach(function (r) { h += fileField(r.k, r.t, true, "image/jpeg,image/png,application/pdf"); });
    h += '<p class="hint">Si falta algún documento, el postulante se guardará como <b>Observado</b> con la lista de pendientes.</p>';
    return h;
  }

  function stepper() {
    return '<ol class="stepper">' + PASOS.map(function (p, i) {
      var n = i + 1;
      return '<li class="' + (n === step ? "cur" : n < step ? "done" : "") + '"' + (n < step ? ' data-act="step" data-step="' + n + '"' : "") +
        '><i>' + (n < step ? "✔" : n) + "</i><span>" + p + "</span></li>";
    }).join("") + "</ol>";
  }

  function formHTML() {
    var cuerpo = [paso1, paso2, paso3, paso4][step - 1]();
    return '<div class="mod-head no-print"><div class="badge">' + '<svg class="ico" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7"/><path d="M19 8v6M16 11h6"/></svg>' +
      "</div><div><h1>Nueva inscripción</h1><p>Proceso " + PROCESO + " · Paso " + step + " de 4</p></div></div>" +
      '<div class="card">' + stepper() + '<div class="step-body">' + cuerpo + "</div>" +
      '<div class="actions">' +
      '<button class="btn ghost" data-act="' + (step === 1 ? "lista" : "prev") + '">' + (step === 1 ? "Cancelar" : "‹ Anterior") + "</button>" +
      (step < 4 ? '<button class="btn" data-act="next">Siguiente ›</button>' :
                  '<button class="btn gold" data-act="guardar">Guardar inscripción</button>') +
      '</div><p class="privacy">Maqueta de demostración: los datos se guardan solo en este navegador y no se envían a ningún servidor.</p></div>';
  }

  /* ---------- validación ---------- */
  function validar(n) {
    var e = {}, v;
    var nom = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]{2,}$/;
    if (n === 1) {
      v = (d.numero_documento || "").trim();
      if (d.tipo_documento === "DNI" ? !/^\d{8}$/.test(v) : !/^[A-Z0-9]{6,12}$/.test(v))
        e.numero_documento = d.tipo_documento === "DNI" ? "El DNI debe tener 8 dígitos." : "Use de 6 a 12 letras o números.";
      else if (cargar().some(function (p) { return p.numero_documento === v; }))
        e.numero_documento = "Ya existe un postulante con este documento.";
      if (!nom.test((d.nombres || "").trim())) e.nombres = "Ingrese los nombres.";
      if (!nom.test((d.apellido_paterno || "").trim())) e.apellido_paterno = "Ingrese el apellido paterno.";
      if ((d.apellido_materno || "").trim() && !nom.test(d.apellido_materno.trim())) e.apellido_materno = "Apellido no válido.";
      if (!d.fecha_nacimiento || d.fecha_nacimiento > hoy() || d.fecha_nacimiento < "1940-01-01") e.fecha_nacimiento = "Fecha no válida.";
      if (!d.sexo) e.sexo = "Seleccione el sexo.";
      if (!/^9\d{8}$/.test(d.telefono || "")) e.telefono = "Celular de 9 dígitos que empiece con 9.";
      if ((d.email || "").trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = "Correo no válido.";
      if (!(d.direccion || "").trim()) e.direccion = "Ingrese la dirección.";
      if (!foto) e.foto = "La fotografía es obligatoria.";
    } else if (n === 2) {
      if (!d.id_carrera) e.id_carrera = "Elija una especialidad.";
      if (!d.turno) e.turno = "Elija un turno.";
    } else if (n === 3) {
      if (!/^[A-Za-z0-9-]{4,30}$/.test((d.numero_operacion || "").trim())) e.numero_operacion = "Ingrese el número de operación.";
      if (!(parseFloat(d.monto) > 0)) e.monto = "Ingrese un importe mayor a 0.";
      if (!d.fecha_pago || d.fecha_pago > hoy()) e.fecha_pago = "Fecha no válida.";
      if (!files.voucher) e.voucher = "Adjunte la imagen del voucher.";
    } else if (n === 4) {
      if (d.modalidad === "INGRESO_DIRECTO" && !d.subtipo) e.subtipo = "Seleccione el tipo de ingreso directo.";
    }
    errors = e;
    return Object.keys(e).length === 0;
  }

  /* ---------- archivos ---------- */
  function reducirFoto(file, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var im = new Image();
      im.onload = function () {
        var s = Math.min(1, 240 / Math.max(im.width, im.height)), c = document.createElement("canvas");
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        cb(c.toDataURL("image/jpeg", 0.8));
      };
      im.onerror = function () { cb(""); };
      im.src = fr.result;
    };
    fr.onerror = function () { cb(""); };
    fr.readAsDataURL(file);
  }
  function alAdjuntar(input) {
    var key = input.getAttribute("data-file"), f = input.files && input.files[0];
    if (!f) return;
    var okTipo = key === "foto" ? /^image\/(jpeg|png)$/.test(f.type) : /^(image\/(jpeg|png)|application\/pdf)$/.test(f.type);
    if (!okTipo) { errors[key] = "Formato no permitido."; return renderKeep(); }
    if (f.size > MAX_MB * 1024 * 1024) { errors[key] = "El archivo supera " + MAX_MB + " MB."; return renderKeep(); }
    delete errors[key];
    if (key === "foto") {
      reducirFoto(f, function (url) {
        if (!url) errors.foto = "No se pudo leer la imagen.";
        foto = url; renderKeep();
      });
    } else { files[key] = f.name; renderKeep(); }
  }

  /* ---------- guardar ---------- */
  function siguienteCodigo(lista) {
    var max = 0;
    lista.forEach(function (p) { var n = parseInt(String(p.codigo).split("-").pop(), 10); if (n > max) max = n; });
    return "POST-" + ANIO + "-" + ("0000" + (max + 1)).slice(-4);
  }
  function docsAdjuntos() {
    var l = [];
    if (files.voucher) l.push({ t: "Voucher de pago", n: files.voucher });
    docsRequeridos().forEach(function (r) { if (files[r.k]) l.push({ t: r.t, n: files[r.k] }); });
    return l;
  }
  function guardarInscripcion() {
    var lista = cargar();
    var pend = docsRequeridos().filter(function (r) { return !files[r.k]; }).map(function (r) { return r.t; });
    var rec = {
      codigo: siguienteCodigo(lista), proceso: PROCESO, fecha_registro: new Date().toISOString(),
      tipo_documento: d.tipo_documento, numero_documento: d.numero_documento.trim(),
      nombres: d.nombres.trim(), apellido_paterno: d.apellido_paterno.trim(),
      apellido_materno: (d.apellido_materno || "").trim(), fecha_nacimiento: d.fecha_nacimiento, sexo: d.sexo,
      telefono: d.telefono, email: (d.email || "").trim(), direccion: d.direccion.trim(),
      es_extranjero: d.tipo_documento !== "DNI", id_carrera: d.id_carrera, turno: d.turno,
      modalidad: d.modalidad, subtipo: d.modalidad === "INGRESO_DIRECTO" ? d.subtipo : "",
      numero_operacion: d.numero_operacion.trim(), monto: parseFloat(d.monto).toFixed(2), fecha_pago: d.fecha_pago,
      foto: foto, docs: docsAdjuntos(), pendientes: pend, estado: pend.length ? "OBSERVADO" : "REGISTRADO"
    };
    lista.push(rec);
    if (!guardar(lista)) { alert("No se pudo guardar en este navegador (almacenamiento lleno o bloqueado)."); return; }
    ficha = rec; mode = "ficha"; render(); window.scrollTo(0, 0);
  }

  /* ---------- lista ---------- */
  function filas() {
    var q = filtro.trim().toLowerCase();
    var l = cargar().filter(function (p) {
      var t = (p.codigo + " " + p.numero_documento + " " + p.nombres + " " + p.apellido_paterno + " " + p.apellido_materno).toLowerCase();
      return !q || t.indexOf(q) !== -1;
    }).reverse();
    if (!l.length) return '<tr><td colspan="7" class="empty">' + (q ? "Sin resultados." : "Aún no hay postulantes inscritos. Pulse «Nuevo postulante».") + "</td></tr>";
    return l.map(function (p) {
      var c = carrera(p.id_carrera) || { corto: p.id_carrera };
      return "<tr><td><b>" + esc(p.codigo) + "</b></td><td>" + esc(p.apellido_paterno + " " + p.apellido_materno + ", " + p.nombres) +
        "</td><td>" + esc(p.numero_documento) + "</td><td>" + esc(c.corto) + "</td><td>" + (p.turno === "DIURNO" ? "Diurno" : "Nocturno") +
        '</td><td><span class="st ' + p.estado + '">' + (p.estado === "REGISTRADO" ? "Registrado" : "Observado") +
        '</span></td><td class="ta"><button class="btn ghost sm" data-act="ver" data-id="' + esc(p.codigo) + '">Ficha</button> ' +
        '<button class="btn ghost sm danger" data-act="del" data-id="' + esc(p.codigo) + '">Eliminar</button></td></tr>';
    }).join("");
  }
  function listaHTML() {
    return '<div class="mod-head no-print"><div class="badge"><svg class="ico" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7"/><path d="M19 8v6M16 11h6"/></svg></div>' +
      "<div><h1>Registro de Postulantes</h1><p>Inscripciones del proceso " + PROCESO + "</p></div></div>" +
      '<div class="card"><div class="toolbar"><input class="search" data-filtro placeholder="Buscar por código, documento o nombre…" value="' + esc(filtro) +
      '"><button class="btn gold" data-act="nuevo">+ Nuevo postulante</button></div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>Código</th><th>Postulante</th><th>Documento</th><th>Especialidad</th><th>Turno</th><th>Estado</th><th></th></tr></thead><tbody id="tbody">' +
      filas() + "</tbody></table></div></div>";
  }

  /* ---------- ficha ---------- */
  function fichaHTML() {
    var p = ficha, c = carrera(p.id_carrera) || { nombre: p.id_carrera };
    function row(k, v) { return "<div><span>" + k + "</span><b>" + esc(v || "—") + "</b></div>"; }
    var docs = (p.docs || []).map(function (x) { return "<li>✔ " + esc(x.t) + " <small>— " + esc(x.n) + "</small></li>"; }).join("");
    var pend = (p.pendientes || []).map(function (t) { return "<li>✖ " + esc(t) + "</li>"; }).join("");
    return '<div class="actions top no-print"><button class="btn ghost" data-act="lista">‹ Volver a la lista</button>' +
      '<span class="spacer"></span><button class="btn ghost" data-act="print">Imprimir ficha</button>' +
      '<button class="btn gold" data-act="nuevo">+ Nuevo postulante</button></div>' +
      '<article class="card ficha"><header><img src="assets/logo.png" alt="IESTP Antenor Orrego Espinoza"><div class="fh"><h2>Ficha de inscripción</h2>' +
      "<p>Proceso de admisión " + esc(p.proceso) + '</p></div><div class="cod">' + esc(p.codigo) +
      '<span class="st ' + p.estado + '">' + (p.estado === "REGISTRADO" ? "Registrado" : "Observado") + "</span></div></header>" +
      '<div class="ficha-main"><div class="photo big">' + (p.foto ? '<img src="' + p.foto + '" alt="Fotografía">' : "") + '</div><div class="datos">' +
      row("Apellidos y nombres", p.apellido_paterno + " " + p.apellido_materno + ", " + p.nombres) +
      row(TIPOS[p.tipo_documento], p.numero_documento) + row("Fecha de nacimiento", fmtFecha(p.fecha_nacimiento)) +
      row("Sexo", p.sexo === "M" ? "Masculino" : "Femenino") + row("Teléfono", p.telefono) + row("Correo", p.email) +
      row("Dirección", p.direccion) + row("Nacionalidad", p.es_extranjero ? "Extranjero" : "Peruano") + "</div></div>" +
      '<h3 class="sub-h">Datos académicos</h3><div class="datos two">' + row("Especialidad", c.nombre) +
      row("Turno", p.turno === "DIURNO" ? "Diurno" : "Nocturno") +
      row("Modalidad", p.modalidad === "ORDINARIO" ? "Ordinario" : "Ingreso directo — " + (DIRECTO[p.subtipo] || "")) + "</div>" +
      '<h3 class="sub-h">Pago (Banco de la Nación)</h3><div class="datos two">' + row("N.º de operación", p.numero_operacion) +
      row("Importe", "S/ " + p.monto) + row("Fecha de pago", fmtFecha(p.fecha_pago)) + "</div>" +
      '<h3 class="sub-h">Documentos</h3><ul class="doclist">' + docs + pend + "</ul>" +
      '<p class="firma">Declaro que los datos consignados son verdaderos.<br><br>______________________________<br>Firma del postulante</p>' +
      '<p class="privacy">Documento generado el ' + new Date(p.fecha_registro).toLocaleString("es-PE") + " (maqueta de demostración).</p></article>";
  }

  /* ---------- render y eventos ---------- */
  function render() {
    root.innerHTML = mode === "lista" ? listaHTML() : mode === "form" ? formHTML() : fichaHTML();
  }

  function sanitizar(t) {
    var id = t.getAttribute("data-f"), v = t.value;
    if (id === "numero_documento") v = d.tipo_documento === "DNI" ? v.replace(/\D/g, "").slice(0, 8) : v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    if (id === "telefono") v = v.replace(/\D/g, "").slice(0, 9);
    if (v !== t.value) t.value = v;
    return v;
  }

  function onClick(e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var a = b.getAttribute("data-act");
    if (a === "nuevo") { nuevo(); mode = "form"; render(); window.scrollTo(0, 0); }
    else if (a === "lista") { mode = "lista"; render(); window.scrollTo(0, 0); }
    else if (a === "prev") { step = Math.max(1, step - 1); errors = {}; render(); window.scrollTo(0, 0); }
    else if (a === "step") { step = parseInt(b.getAttribute("data-step"), 10); errors = {}; render(); }
    else if (a === "next") { if (validar(step)) { step++; errors = {}; } render(); window.scrollTo(0, 0); }
    else if (a === "guardar") {
      if (!validar(4)) return render();
      for (var n = 1; n <= 3; n++) { if (!validar(n)) { step = n; render(); window.scrollTo(0, 0); return; } }
      guardarInscripcion();
    }
    else if (a === "ver") {
      var id = b.getAttribute("data-id");
      ficha = cargar().filter(function (p) { return p.codigo === id; })[0];
      if (ficha) { mode = "ficha"; render(); window.scrollTo(0, 0); }
    }
    else if (a === "del") {
      var cod = b.getAttribute("data-id");
      if (confirm("¿Eliminar al postulante " + cod + "?")) {
        guardar(cargar().filter(function (p) { return p.codigo !== cod; }));
        render();
      }
    }
    else if (a === "print") { window.print(); }
  }

  function limpiarError(t) {
    var id = t.getAttribute("data-f") || t.getAttribute("data-file");
    if (!id || !errors[id]) return;
    delete errors[id];
    var wrap = t.closest(".field");
    if (wrap) { wrap.classList.remove("bad"); var m = wrap.querySelector(".err"); if (m) m.remove(); }
  }

  function onInput(e) {
    var t = e.target;
    if (t.hasAttribute("data-filtro")) { filtro = t.value; var tb = root.querySelector("#tbody"); if (tb) tb.innerHTML = filas(); return; }
    if (!t.hasAttribute("data-f") || t.type === "radio" || t.tagName === "SELECT") return;
    d[t.getAttribute("data-f")] = sanitizar(t);
    limpiarError(t);
  }

  function onChange(e) {
    var t = e.target;
    if (t.hasAttribute("data-file")) return alAdjuntar(t);
    if (!t.hasAttribute("data-f")) return;
    var id = t.getAttribute("data-f");
    d[id] = t.value;
    limpiarError(t);
    if (id === "tipo_documento") d.numero_documento = "";
    if (id === "modalidad" && t.value === "ORDINARIO") { d.subtipo = ""; delete files.especial; }
    if (id === "subtipo") delete files.especial;
    if (t.hasAttribute("data-re")) renderKeep();
  }

  window.Registro = {
    render: function (container) {
      root = container;
      root.onclick = onClick; root.oninput = onInput; root.onchange = onChange;
      var pre = null;
      try { pre = sessionStorage.getItem("espSel"); } catch (x) {}
      if (pre) { nuevo(); mode = "form"; } else { mode = "lista"; filtro = ""; }
      render();
    }
  };
})();
