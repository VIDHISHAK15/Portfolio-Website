import './index.scss'
import LogoS from '../../assets/images/result 1.svg'
import { useRef } from 'react'

const Logo = () => {
  const bgRef = useRef()
  const outlineRef = useRef()
  const solidLogoRef = useRef()

  return (
    <div className="logo-container" ref={bgRef}>
      <img ref={solidLogoRef} className="solid-logo" src={LogoS} alt="logo" />
      <svg
        version="1.0"
        viewBox="0 0 9 11.25"
        xmlns="http://www.w3.org/2000/svg"
        width="342px"
        height="323px"
      >
        <g
          className="svg-container"
          transform="translate(0 457) scale(.1 -.1)"
          fill="none"
        >
          <path
            ref={outlineRef}
            d="m7 0h-5v1h-1v1h-1v5h1v1h1v1h5v-1h1v-1h1v-5h-1v-1h-1v-1zm0 2v-1h-1v1h-1v-1h-1v1h-1v-1h-1v1h-1v1h1v-1h1v1h3v-1h1zm0 1v-1h1v1h-1zm-1 1h-3v1h3v-1zm-4 0h-1v1h1v-1zm5 0h1v1h-1v-1zm0 3v-1h1v1h-1zm-1 0h1v1h-1v-1zm-3 0v-1h3v1h-1v1h-1v-1h-1zm-1 0v-1h-1v1h1zm0 0h1v1h-1v-1z"
          />
        </g>
      </svg>
    </div>
  )
}

export default Logo
