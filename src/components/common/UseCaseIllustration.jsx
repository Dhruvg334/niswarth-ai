import educationImage from '../../assets/usecase-education.jpg'
import animalImage from '../../assets/usecase-animal.jpg'
import environmentImage from '../../assets/usecase-environment.jpg'

const images = {
  'Education Drives': educationImage,
  'Animal Welfare': animalImage,
  'Environment Drives': environmentImage,
}

export default function UseCaseIllustration({ title }) {
  const image = images[title] || educationImage

  return (
    <div className="mb-7 overflow-hidden rounded-[1.75rem] border border-green-100 bg-green-50 shadow-[0_20px_50px_-34px_rgba(20,83,45,0.45)]">
      <img
        src={image}
        alt={`${title} workflow illustration`}
        className="h-44 w-full object-cover"
        loading="lazy"
      />
    </div>
  )
}
