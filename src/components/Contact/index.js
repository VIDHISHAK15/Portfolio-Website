import AnimatedLetter from '../AnimatedLetter'
import './index.scss'
import Loader from 'react-loaders'
import { useEffect, useRef, useState } from 'react'
import emailjs from '@emailjs/browser'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

const Contact = () => {
  const [letterClass, setLetterClass] = useState('text-animate')
  const refForm = useRef()

  useEffect(() => {
    setTimeout(() => {
      return setLetterClass('text-animate-hover')
    }, 4000)
  }, [])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const sendEmail = (e) => {
    e.preventDefault()

    const ServiceId = 'service_w35jr8u'
    const template = 'template_q3o7for'
    const publickey = '3q1Utfo3iBzn0fhrL'

    const templateparam = {
      from_name: name,
      from_email: email,
      to_name: 'web',
      message: message,
    }

    emailjs
      .send(ServiceId, template, templateparam, publickey)
      .then((response) => {
        console.log('SUCCESS!')
      })
      .catch((err) => {
        console.log('FAILED...')
      })
  }

  return (
    <>
      <div className="container contact">
        <div className="text-zone">
          <h1>
            <AnimatedLetter
              letterClass={letterClass}
              strArray={['C', 'o', 'n', 't', 'a', 'c', 't', '', 'M', 'e']}
              idx={15}
            />
          </h1>
          <p>
            I am interested in freelence opportunities - especially ambitious or
            large projects. However, if you have other request or question ,
            don't hesitate t contact me using below form either.
          </p>
          <div className="contact-form">
            <form ref={refForm} onSubmit={sendEmail}>
              <ul>
                <li className="half">
                  <input type="text" name="name" placeholder="Name" required />
                </li>
                <li className="half">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    required
                  />
                </li>
                <li>
                  <input
                    placeholder="Subject"
                    type="text"
                    name="subject"
                    required
                  />
                </li>
                <li>
                  <textarea
                    placeholder="Message"
                    name="message"
                    required
                  ></textarea>
                </li>
                <li>
                  <input type="submit" className="flat-button" value="Send" />
                </li>
              </ul>
            </form>
          </div>
        </div>
        <div className="info-map">
          Vidhisha Katariya
          <br />
          India
          <br />
          Shivaji Nagar, Sinnar 422103 <br />
          <span>vidhisha.katariya@gmail.com</span>{' '}
        </div>
        <div className="map-wrap">
          <MapContainer center={[19.84367, 73.99032]} zoom={13}>
            <TileLayer url='https://tile.openstreetmap.org/{z}/{x}/{y}.png'/>
            <Marker position={[19.84367, 73.99032]}>
              <Popup> Come over for a cup of coffee 😁</Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

      <Loader type="pacman"></Loader>
    </>
  )
}

export default Contact
