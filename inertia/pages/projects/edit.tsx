import { usePage } from '@inertiajs/react'
import ProjectForm from './ProjectForm'
import { Project } from '../../types/project'

type PageProps = {
  project: Project
  statusOptions?: string[]
}

export default function ProjectEdit() {
  const { project } = usePage<PageProps>().props
  
  return <ProjectForm project={project} />
}