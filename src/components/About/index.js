import './index.scss'
import AnimatedLetter from '../AnimatedLetter'
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngular, faCss3, faGit, faHtml5, faJs, faReact } from '@fortawesome/free-brands-svg-icons';
import { faSquare } from '@fortawesome/free-solid-svg-icons';
import Loader from 'react-loaders';

const About = () => {
    const [letterClass, setLetterClass] = useState('text-animate')
    useEffect(() => {
        setTimeout(() => {
         return setLetterClass('text-animate-hover')
        }, 3000)
    },[])
    return (
        <>
        <div className='container about-page'>
            <div className='text-zone'>
                <h1>
                    <AnimatedLetter
                        letterClass={letterClass}
                        strArray={['A', 'b', 'o', 'u', 't', ' ', 'M', 'e']}
                        idx={15}
                    />
                </h1>
                <p>Passionate about crafting innovative solutions and pushing the boundaries of web development, </p>
                <p>I excel at building scalable and dynamic web applications that deliver exceptional user experiences.</p>
                <p>I am a seasoned full stack developer with a deep understanding of both frontend and backend technologies looking for role in established company or startup with opportunity to work with latest technologies on challenging and diverse projects</p>
            </div>
            <div className='stage-cube'>
                <div className='cubespinner'>
                    <div className='face1'>
                        <FontAwesomeIcon icon={faAngular} color='#dd0031'/>
                    </div>
                    <div className='face2'>
                        <FontAwesomeIcon icon={faHtml5} color='#f06529'/>
                    </div>
                    <div className='face3'>
                        <FontAwesomeIcon icon={faCss3} color='#28A4d9' />
                    </div>
                    <div className='face4'>
                        <FontAwesomeIcon icon={faReact} color='#5ed4f4'/>
                    </div>
                    <div className='face5'>
                        <FontAwesomeIcon icon={faJs} color='#efd81d'/>
                    </div>
                    <div className='face6'>
                        <FontAwesomeIcon icon={faGit} color='#ec48'/>
                    </div>
                </div> 
                </div>
            </div> 
            <Loader type='pacman'/>
        </>
       

       
    )
}

export default About 