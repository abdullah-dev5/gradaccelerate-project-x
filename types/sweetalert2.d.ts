declare module 'sweetalert2/dist/sweetalert2.all.js' {
  import Swal from 'sweetalert2'
  export default Swal
}

// Inertia.js TypeScript extensions
declare module '@inertiajs/react' {
  interface PageProps {
    errors?: {
      general?: string
      email?: string
      password?: string
      [key: string]: string | undefined
    }
    success?: string
    error?: string
  }
}
