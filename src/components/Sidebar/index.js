import './index.scss'
import { Link, NavLink } from 'react-router-dom'
import LogoS from '../../assets/images/result.svg'
// import LogoSub from '../../assets/images/logo_sub.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faFolder, faHome, faUser } from '@fortawesome/free-solid-svg-icons'
import { faGithub, faHackerrank, faLinkedin} from '@fortawesome/free-brands-svg-icons'

const Sidebar = () => (
  <div className="nav-bar">
    <Link className="logo" to="/">
      <img src={LogoS} alt="logo" />
      {/* <img className='sub-logo' src={LogoSub} alt='logo'/> */}
    </Link>
    <nav>
      <NavLink exact="true" 
        activeclassname="active" 
         to="/">
        <FontAwesomeIcon icon={faHome} color="#4d4d4e" />
      </NavLink>
      <NavLink
        exact="true"
        activeclassname="active"
        className="about-link"
        to="/about">
        <FontAwesomeIcon icon={faUser} color="#4d4d4e" />
      </NavLink>
      <NavLink
        exact="true"
        activeclassname="active"
        className="contact-link"
        to="/contact"
      >
        <FontAwesomeIcon icon={faEnvelope} color="#4d4d4e" />
      </NavLink>
      <NavLink
        exact="true"
        activeclassname="active"
        className="project-link"
        to="/project"
      >
        <FontAwesomeIcon icon={faFolder} color="#4d4d4e" />
      </NavLink>
    </nav>
    <ul>
      <li>
        <a 
        target='_blank'
        rel='noreferrer'
        href='https://www.linkedin.com/in/vidhisha-katariya-7b1440230/'
        >
          <FontAwesomeIcon icon={faLinkedin} color="#4d4d4e"></FontAwesomeIcon>
        </a>
      </li>
      <li>
        <a 
        target='_blank'
        rel='noreferrer'
        href='https://github.com/VIDHISHAK15'
        >
          <FontAwesomeIcon icon={faGithub} color="#4d4d4e"></FontAwesomeIcon>
        </a>
      </li>
      <li>
        <a 
        target='_blank'
        rel='noopener'
        href='https://www.hackerrank.com/profile/vidhisha_katari1'
        >
          <FontAwesomeIcon icon={faHackerrank} color="#4d4d4e">
          </FontAwesomeIcon>
        </a>
      </li>
    
    </ul>
  </div>
)

export default Sidebar
