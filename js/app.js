"use strict";

const ENDPOINT = "https://rickandmortyapi.com/api/location";
const CLAVE_BUSQUEDA = "ultima-busqueda";

const formulario = document.getElementById("formulario");
const inputNombre = document.getElementById("nombre");
const inputTipo = document.getElementById("tipo");
const botonBuscar = document.getElementById("btn-buscar");
const aviso = document.getElementById("aviso");
const resultados = document.getElementById("resultados");

/* ---------- Acceso a la API ---------- */

const construirUrl = (nombre, tipo) => {
  const url = new URL(ENDPOINT);
  if (nombre) url.searchParams.set("name", nombre);
  if (tipo) url.searchParams.set("type", tipo);
  return url;
};

// Devuelve el arreglo de ubicaciones; la API responde 404 si no hay coincidencias.
const pedirUbicaciones = async (url) => {
  const respuesta = await fetch(url);
  if (respuesta.status === 404) return [];
  if (!respuesta.ok) {
    throw new Error(`El servidor respondió con el código ${respuesta.status}.`);
  }
  const datos = await respuesta.json();
  return datos.results;
};

/* ---------- Presentación ---------- */

const valorODesconocido = (valor) => {
  const texto = String(valor ?? "").trim();
  return texto === "" || texto.toLowerCase() === "unknown" ? "Desconocido" : texto;
};

const crearDato = (etiqueta, valor) => {
  const dt = document.createElement("dt");
  dt.textContent = etiqueta;
  const dd = document.createElement("dd");
  dd.textContent = valor;
  return [dt, dd];
};

const crearTarjeta = (ubicacion) => {
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta";

  const titulo = document.createElement("h2");
  titulo.textContent = valorODesconocido(ubicacion.name);

  const lista = document.createElement("dl");
  lista.append(
    ...crearDato("Tipo", valorODesconocido(ubicacion.type)),
    ...crearDato("Dimensión", valorODesconocido(ubicacion.dimension)),
    ...crearDato("Residentes", ubicacion.residents.length)
  );

  tarjeta.append(titulo, lista);
  return tarjeta;
};

const mostrarTarjetas = (ubicaciones) => {
  resultados.replaceChildren(...ubicaciones.map(crearTarjeta));
};

const mostrarMensaje = (texto, esError = false) => {
  aviso.textContent = texto;
  aviso.className = esError ? "aviso error" : "aviso";
};

const establecerBuscando = (buscando) => {
  botonBuscar.disabled = buscando;
  botonBuscar.textContent = buscando ? "Buscando…" : "Buscar";
  if (buscando) mostrarMensaje("Buscando…");
};

/* ---------- Persistencia ---------- */

const guardarBusqueda = (nombre, tipo) => {
  try {
    localStorage.setItem(CLAVE_BUSQUEDA, JSON.stringify({ nombre, tipo }));
  } catch (error) {
    // Si localStorage no está disponible, la búsqueda sigue funcionando.
  }
};

const leerBusqueda = () => {
  try {
    const guardada = JSON.parse(localStorage.getItem(CLAVE_BUSQUEDA));
    return guardada && typeof guardada === "object" ? guardada : null;
  } catch (error) {
    return null;
  }
};

/* ---------- Flujo de búsqueda ---------- */

const buscar = async (nombre, tipo) => {
  if (!nombre && !tipo) {
    mostrarMensaje("Escribe un nombre o un tipo para buscar.");
    resultados.replaceChildren();
    return;
  }

  establecerBuscando(true);
  try {
    const ubicaciones = await pedirUbicaciones(construirUrl(nombre, tipo));
    guardarBusqueda(nombre, tipo);
    mostrarTarjetas(ubicaciones);
    mostrarMensaje(
      ubicaciones.length === 0
        ? "Sin resultados: no hay ubicaciones que coincidan con tu búsqueda."
        : `Se encontraron ${ubicaciones.length} ubicaciones.`
    );
  } catch (error) {
    resultados.replaceChildren();
    mostrarMensaje(
      error instanceof TypeError
        ? "Error de conexión: no se pudo contactar con la API. Revisa tu internet."
        : `Error: ${error.message}`,
      true
    );
  } finally {
    botonBuscar.disabled = false;
    botonBuscar.textContent = "Buscar";
  }
};

const manejarEnvio = (evento) => {
  evento.preventDefault();
  buscar(inputNombre.value.trim(), inputTipo.value.trim());
};

const restaurarUltimaBusqueda = () => {
  const guardada = leerBusqueda();
  if (!guardada) return;
  inputNombre.value = guardada.nombre || "";
  inputTipo.value = guardada.tipo || "";
  buscar(inputNombre.value.trim(), inputTipo.value.trim());
};

formulario.addEventListener("submit", manejarEnvio);
restaurarUltimaBusqueda();
