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

Lo más simple es abrir `frontend/index.html` con doble clic. Si usas VS Code, la extensión Live Server también sirve. Otra opción es levantar un servidor con Python:

```bash
python -m http.server 5500 --directory frontend
```

y entrar a <http://localhost:5500>.

La primera vez se cargan datos de ejemplo: tres dueños, cuatro mascotas y algunas citas. Para volver a ese estado, escribe `reiniciarDatos()` en la consola del navegador.

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
