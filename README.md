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
| Cita     | fecha, hora, motivo, estado (pendiente, atendida o cancelada) | pertenece a una mascota |
| Atención | diagnóstico, tratamiento, medicamentos                       | sale de una cita        |

## Taller 1: frontend

Todo está hecho con HTML5, CSS y JavaScript, sin backend todavía.

La página de **inicio** (`index.html`) presenta el sistema y explica por qué existe. En **Citas** (`citas.html`) se ve el listado con filtros por fecha y estado, y desde ahí se puede editar o cancelar. **Agendar cita** (`nueva-cita.html`) es el formulario para reservar o modificar una hora. **Mascotas** (`mascotas.html`) lista las mascotas y permite registrar un dueño nuevo con su mascota. Y la ficha de cada mascota (`mascota.html`) muestra su historial clínico y deja registrar una atención.

Nos dividimos el trabajo por módulos. Uno se encarga de Citas y Agendar; la otra, de Mascotas y la ficha clínica. El inicio y los archivos compartidos los armamos entre los dos.

### Cómo está organizado

```
frontend/
├── index.html, citas.html, nueva-cita.html, mascotas.html, mascota.html
├── css/styles.css        nuestros estilos, cargados encima de la plantilla
├── img/                  favicon, fondo del banner e imagen del inicio
├── js/
│   ├── data.js           lectura y escritura de datos (localStorage)
│   ├── validaciones.js   RUT, email, teléfono, fechas y horario de atención
│   ├── ui.js             mensajes, errores de formulario, modal de confirmación y menú
│   └── dashboard.js      lógica del inicio
└── vendors/              código de terceros, no se toca
    ├── boldo/            CSS de la plantilla Boldo (trae Bootstrap 5)
    ├── bootstrap/        JavaScript de Bootstrap, para el menú en celular
    └── fontawesome/      íconos
```

El diseño parte de la plantilla gratuita [Boldo de ThemeWagon](https://themewagon.com/themes/boldo/). De ahí sacamos los colores, la tipografía Manrope, los botones y el banner. Lo que es propio del sistema (etiquetas de estado de las citas, mensajes, el modal de confirmación, los errores en los formularios y la sección "Acerca de nosotros") lo escribimos nosotros en `css/styles.css`. Así queda claro qué es plantilla y qué es trabajo nuestro.

### Una decisión que vale la pena explicar

Ninguna página toca `localStorage` directamente. Todas pasan por las funciones de `data.js`, como `obtenerCitas()` o `crearCita()`. Parece un paso extra, pero nos ahorra trabajo después. En el Taller 2 solo vamos a cambiar el interior de esas funciones por llamadas `fetch()` al backend, y el resto del código queda igual.

### Cómo abrirlo

Lo más simple es abrir `frontend/index.html` con doble clic. Si usas VS Code, la extensión Live Server también sirve. Otra opción es levantar un servidor con Python:

```bash
python -m http.server 5500 --directory frontend
```

y entrar a <http://localhost:5500>.

La primera vez se cargan datos de ejemplo: tres dueños, cuatro mascotas y algunas citas. Para volver a ese estado, escribe `reiniciarDatos()` en la consola del navegador.
