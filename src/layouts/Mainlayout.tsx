import Navbar from '../components/navigation/Navbar'
import {Outlet} from 'react-router'

function Mainlayout () {
    return (
        <>
            <Navbar />
            <Outlet />
        </>
    )
}

export default Mainlayout
