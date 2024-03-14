import { Link } from 'react-router-dom'
import LogoTitle from '../../assets/images/logo-s.png'
import './index.scss'
import { useState, useEffect } from 'react'
import Logo from '../Logo'
// import { useEffect } from 'react'
import AnimatedLetter from '../AnimatedLetter'
import Loader from 'react-loaders'

const Home = () => {
  const [letterClass, setLetterClass] = useState('text-animate')
  const nameArray = ['V','i','d','h','i','s','h','a']
  const jobArray = [
    'W',
    'e',
    'b',
    '',
    'D',
    'e',
    'v',
    'e',
    'l',
    'o',
    'p',
    'e',
    'r',
    '.',
  ]

  useEffect(() => {
    setTimeout(() => {
     return setLetterClass('text-animate-hover')
    }, 4000)
  },[])

  return (
    <>
    <div className="container home-page">
      <div className="text-zone">
        <h1>
          <span className={letterClass}>H</span>
          <span className={`${letterClass} _12`}>i,</span>
          <br />
          <span className={`${letterClass} _13`}>I'   </span>
          <span className={`${letterClass} _14`}>m   </span>

          {/* <img src={LogoTitle} alt="developer" /> */}
          {/* <a>Vidhisha <br/></a> */}
          <AnimatedLetter
            letterClass={letterClass}
            strArray={nameArray}
            idx={15}
          />
          <br />
          <AnimatedLetter
            letterClass={letterClass}
            strArray={jobArray}
            idx={22}
          />
        </h1>
        <h2>
          Frontend Developer / JavaScript Enthusiast / Problem Solver / UI&UX
        </h2>
        <br />I love to build web applications that are not only visually
        pleasing but also highly functional and user friendly.
        <Link to="/contact" className="flat-button">
          CONTACT ME{' '}
        </Link>
      </div>
      <Logo />
      </div>
      <Loader type='pacman' />
      </>
  )
}
export default Home
