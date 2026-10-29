# VetCitas

Sistema de citas y fichas clínicas para clínicas veterinarias pequeñas. Lo desarrollamos para la asignatura **PTEC103 Desarrollo Web y Móvil**, y va a crecer taller a taller: primero la web, después el servidor, luego la base de datos y al final una app móvil.

## El problema

Muchas clínicas veterinarias chicas todavía agendan por WhatsApp o por teléfono. La hora queda anotada en un cuaderno, en una planilla o en la memoria de quien contestó. El historial de cada mascota termina repartido entre mensajes y papeles, y cuando alguien necesita saber qué vacuna le pusieron a un perro hace seis meses, nadie lo encuentra.

Eso trae tres problemas concretos. Se pierde información. Se agendan dos citas a la misma hora. Y dar seguimiento a un tratamiento se vuelve casi imposible.

Elegimos esta idea porque es un problema real, cercano y fácil de entender, y porque encaja con la forma del curso. Una agenda de citas pide formularios y validaciones. Las mascotas con sus dueños piden una base de datos relacional. Y que el dueño revise la cita desde el celular justifica la app móvil sin forzar nada.

## Quién lo usa

Hay dos tipos de usuario. Los **dueños de mascotas** agendan horas y revisan el historial de su mascota. El **personal de la clínica**, veterinarios y recepcionistas, gestiona la agenda y registra el diagnóstico después de cada atención.

## Qué información maneja

Cuatro entidades, relacionadas en cadena:

| Entidad  | Datos                                                        | Relación                |
|----------|--------------------------------------------------------------|-------------------------|
| Dueño    | nombre, RUT, teléfono, email                                 | tiene una o más mascotas |
| Mascota  | nombre, especie, raza, edad                                  | pertenece a un dueño    |
| Cita     | fecha, hora, motivo, observaciones, estado (pendiente, atendida o cancelada) | pertenece a una mascota |
| Atención | diagnóstico, tratamiento, medicamentos                       | sale de una cita        |

## Taller 1: frontend

Todo está hecho con HTML5, CSS y JavaScript, sin backend todavía.

La página de **inicio** (`index.html`) presenta el sistema y explica por qué existe. En **Citas** (`citas.html`) se ve el listado con filtros por fecha y estado, y desde ahí se puede editar o cancelar. **Agendar cita** (`nueva-cita.html`) es el formulario para reservar o modificar una hora. **Mascotas** (`mascotas.html`) lista las mascotas con un buscador y permite registrar una mascota, con un dueño que ya existe o con uno nuevo. Y la ficha de cada mascota (`mascota.html`) muestra sus datos, los de su dueño, su historial clínico y sus citas. Desde la ficha se registra la atención de una cita, y también se puede editar o eliminar la mascota.

Nos dividimos el trabajo por módulos. Uno se encarga de Citas y Agendar; la otra, de Mascotas y la ficha clínica. El inicio y los archivos compartidos los armamos entre los dos.

### Cómo está organizado

```
frontend/
├── index.html, citas.html, nueva-cita.html, mascotas.html, mascota.html
├── css/styles.css        nuestros estilos, cargados encima de la plantilla
├── img/                  favicon, fondo del banner e imagen del inicio
├── js/
│   ├── data.js           lectura y escritura de datos (localStorage)
│   ├── validaciones.js   RUT, email, teléfono, edad, fechas y horario de atención
│   ├── ui.js             mensajes, errores de formulario, modal, menú y funciones de texto
│   ├── dashboard.js      lógica del inicio
│   ├── citas.js          listado de citas: filtros, búsqueda y cancelación
│   ├── nueva-cita.js     formulario para agendar o modificar una cita
│   ├── mascotas.js       listado de mascotas y registro con su dueño
│   └── mascota.js        ficha: historial, atención, edición y eliminación
└── vendors/              código de terceros, no se toca
    ├── boldo/            CSS de la plantilla Boldo (trae Bootstrap 5)
    ├── bootstrap/        JavaScript de Bootstrap, para el menú en celular
    └── fontawesome/      íconos
```

El diseño parte de la plantilla gratuita [Boldo de ThemeWagon](https://themewagon.com/themes/boldo/). De ahí sacamos los colores, la tipografía Manrope, los botones y el banner. Lo que es propio del sistema (etiquetas de estado de las citas, mensajes, el modal de confirmación, los errores en los formularios y la sección "Acerca de nosotros") lo escribimos nosotros en `css/styles.css`. Así queda claro qué es plantilla y qué es trabajo nuestro.

### Una decisión que vale la pena explicar

Ninguna página toca `localStorage` directamente. Todas pasan por las funciones de `data.js`, como `obtenerCitas()` o `crearCita()`. Parece un paso extra, pero nos ahorra trabajo después. En el Taller 2 solo vamos a cambiar el interior de esas funciones por llamadas `fetch()` al backend, y el resto del código queda igual.

Lo mismo pasa con el código que se repite. Las validaciones viven en `validaciones.js` y las funciones de interfaz en `ui.js`, como mostrar mensajes, marcar errores o quitar tildes para buscar. Cada módulo las usa sin copiarlas.

Las páginas de detalle reciben el dato que necesitan por la URL. `mascota.html?id=3` abre la ficha de la mascota 3, `nueva-cita.html?id=5` abre la cita 5 para modificarla, y `nueva-cita.html?mascota=3` abre el formulario con esa mascota ya elegida. Así una sola página sirve para todas las mascotas y todas las citas.

### Cómo abrirlo

En el Taller 1 bastaba con abrir `frontend/index.html` con doble clic. Desde el Taller 2 las páginas piden los datos al servidor, así que hay que encenderlo como se explica en la sección siguiente.

## Taller 2: backend

El servidor está hecho solo con Node.js, sin Express ni ninguna otra librería. Así lo pidió el profesor, y la verdad es que nos sirvió: tuvimos que escribir a mano lo que un framework esconde, como decidir qué función atiende cada URL o juntar los datos que llegan desde un formulario.

Los datos viven en memoria mientras el servidor está encendido. Al apagarlo se pierden y al volver a encenderlo parte con los datos de ejemplo. La base de datos llega en el Taller 3.

### Cómo encenderlo

Hace falta tener Node.js 18 o más nuevo. Desde la carpeta `backend`:

```bash
npm start
```

y entrar a <http://localhost:3000>. El mismo servidor entrega las páginas y responde la API, así que no hace falta Live Server. Mientras se programa conviene usar `npm run dev`, que reinicia el servidor solo cada vez que se guarda un archivo.

En la consola aparece cada petición con su resultado, por ejemplo `GET /api/citas → 200`.

### Arquitectura

![Arquitectura de VetCitas](docs/taller2/diagrama%20de%20la%20arquitectura.png)

El diagrama se lee de izquierda a derecha: el navegador, el servidor y los datos.

Al servidor le llegan dos tipos de peticiones. Cuando alguien abre `citas.html`, está pidiendo un archivo. `server.js` se lo encarga a `archivos.js`, que lo busca en la carpeta `frontend/` y lo entrega. Cuando la URL empieza con `/api`, lo que se piden son datos, y ahí empieza el camino de la columna del medio. `http.js` lee el JSON que llegó, el enrutador busca qué función atiende esa URL y la ruta hace el trabajo.

Las cajas que están a la derecha dentro del servidor no son pasos del camino. Son cosas que se consultan mientras se recorre. La que más nos costó ubicar fue `validaciones.js`. Al principio la dibujamos como un paso más después de las rutas, y no lo es. La ruta le pregunta "¿esta fecha cae en domingo?" o "¿este RUT es válido?", y validaciones solo contesta sí o no. Quien decide si responder 400 o 409 es la ruta. Quien envía la respuesta es `server.js`, a través de `http.js`.

Los datos viven en `almacen.js`. Las rutas le piden guardar o buscar algo y reciben una copia, nunca el dato original, así ninguna lo cambia por accidente.

Lo punteado es lo que viene. En el Taller 3 una base de datos reemplaza a `almacen.js` y no hay que tocar nada más, porque las rutas solo usan sus funciones: listar, buscar, insertar, actualizar y eliminar. En el Taller 4 la app móvil va a usar la misma API que la página. Por eso el servidor ya acepta peticiones desde otros orígenes (CORS).

Debajo del diagrama hay un ejemplo de punta a punta: lo que pasa desde que alguien aprieta "Agendar cita" hasta que ve "¡Cita agendada!".

Lo hicimos en draw.io. El archivo original está en [docs/taller2/arquitectura.drawio](docs/taller2/arquitectura.drawio), por si hay que cambiarlo.

### Cómo está organizado

```
backend/
├── server.js             recibe cada petición: si empieza con /api la atiende una ruta,
│                         si no, entrega el archivo del frontend
├── validaciones.js       las mismas reglas del frontend, revisadas otra vez en el servidor
├── datos/
│   ├── datos-iniciales.js    datos de ejemplo
│   └── almacen.js            listas en memoria: listar, buscar, insertar, actualizar, eliminar
├── rutas/                una por entidad: citas, dueños, mascotas y atenciones
└── utilidades/
    ├── enrutador.js      decide qué función atiende cada método y URL
    ├── http.js           lee los datos que llegan y arma las respuestas JSON
    ├── archivos.js       entrega las páginas del frontend
    └── fechas.js
```

Del lado del navegador, `data.js` tiene la función `api()`, que envía la petición con `fetch()` y devuelve la respuesta. Si el servidor rechaza los datos, `mostrarErroresServidor()` (en `ui.js`) marca cada error bajo su campo, igual que las validaciones del navegador.

En el Taller 1 pensamos que bastaría con cambiar el interior de las funciones de `data.js`. No fue así: `fetch()` es asíncrono, y cada página tuvo que aprender a esperar la respuesta con `await` y a mostrar los errores del servidor. Por eso las páginas llaman a `api()` directamente y `data.js` quedó solo con esa función y las utilidades de fecha.

Validamos dos veces a propósito. El navegador avisa rápido mientras se llena el formulario, pero cualquiera puede saltárselo y llamar a la API directamente, así que el servidor no confía en nada de lo que recibe.

### Respuestas de la API

Las respuestas siempre vienen en JSON. Cuando algo sale mal, el código HTTP dice qué pasó y el cuerpo trae el detalle:

```json
{
  "error": "Revisa los datos de la cita.",
  "errores": { "fecha": "La clínica no atiende los domingos." }
}
```

Usamos `400` cuando los datos vienen mal, `404` cuando lo que se busca no existe, `405` cuando la URL existe pero no con ese método, `409` cuando hay un choque (un horario ya tomado o un RUT repetido) y `500` si algo falla dentro del servidor.

### Rutas de la API

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/salud` | Comprueba que el servidor está encendido |
| GET | `/api/citas` | Lista las citas. Acepta `?estado=`, `?fecha=` y `?mascotaId=` |
| GET | `/api/citas/horarios?fecha=` | Horarios del día y si están libres. Al editar se agrega `&excluir=ID` |
| GET | `/api/citas/:id` | Una cita |
| POST | `/api/citas` | Agenda una cita (409 si el horario está tomado) |
| PUT | `/api/citas/:id` | Modifica una cita pendiente |
| PATCH | `/api/citas/:id/cancelar` | Cancela una cita pendiente |
| GET | `/api/duenos` | Lista los dueños |
| GET | `/api/duenos/:id` | Un dueño |
| POST | `/api/duenos` | Registra un dueño (409 si el RUT ya existe) |
| GET | `/api/mascotas` | Lista las mascotas. Acepta `?duenoId=` |
| GET | `/api/mascotas/:id` | Una mascota |
| POST | `/api/mascotas` | Registra una mascota (409 si el dueño ya tiene una con ese nombre) |
| PUT | `/api/mascotas/:id` | Modifica una mascota |
| DELETE | `/api/mascotas/:id` | Elimina la mascota junto con sus citas y atenciones |
| GET | `/api/mascotas/:id/atenciones` | Historial clínico de una mascota |
| POST | `/api/atenciones` | Registra una atención y deja la cita como atendida |

### Evidencia de funcionamiento

Las capturas están en `docs/taller2/`.

1. [Listado de mascotas](docs/taller2/01-listado-mascotas.png) cargado desde el servidor.
2. [RUT inválido](docs/taller2/02-error-rut-invalido.png): el dígito verificador no coincide.
3. [Registro de una mascota](docs/taller2/03-registro-mascota.png).
4. [Nombre repetido](docs/taller2/04-error-nombre-repetido.png) para el mismo dueño.
5. [RUT repetido](docs/taller2/05-servidor-rut-repetido-409.png): el servidor responde 409.
6. [Ficha de la mascota](docs/taller2/06-ficha-mascota.png).
7. [Registro de una atención](docs/taller2/07-registro-atencion.png).
8. [Edición de una mascota](docs/taller2/08-editar-mascota.png).
9. [Confirmación antes de eliminar](docs/taller2/09-confirmar-eliminacion.png).
10. [Mascota eliminada](docs/taller2/10-mascota-eliminada.png).
11. [Listado de citas](docs/taller2/11-listado-citas.png) cargado desde el servidor (`GET /api/citas → 200`).
12. [Horarios del día](docs/taller2/12-horarios-ocupados.png): los que ya pasaron y los ocupados no se pueden elegir.
13. [Domingo rechazado](docs/taller2/13-error-domingo.png): "La clínica no atiende los domingos".
14. [Cita agendada](docs/taller2/14-cita-agendada.png) (`POST /api/citas → 201`).
15. [Hora tomada](docs/taller2/15-horario-tomado-409.png) por otra persona mientras se llenaba el formulario.
16. [Cita modificada](docs/taller2/16-modificar-cita.png) (`PUT /api/citas/3 → 200`).
17. [Cita cancelada](docs/taller2/17-confirmar-cancelacion.png) (`PATCH /api/citas/6/cancelar → 200`).
18. [La terminal del servidor](docs/taller2/18-terminal-servidor.png) con cada petición y su código.
