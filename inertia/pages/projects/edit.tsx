// inertia/pages/projects/Edit.tsx
import { usePage } from '@inertiajs/react'
import ProjectForm from './ProjectForm'

// Define the expected props structure
type PageProps = {
  project: {
    id: number
    title: string
    description: string
    status: 'pending' | 'in_progress' | 'completed'
  }
}

export default function ProjectEdit() {
  // Type the usePage hook with PageProps
  const { project } = usePage<PageProps>().props
  
  return <ProjectForm project={project} />
}