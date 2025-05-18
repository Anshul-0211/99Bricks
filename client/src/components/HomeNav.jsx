import React from 'react'
import logo from '../assets/logo.png'

const HomeNav = () => {
return (
    <div className="fixed top-0 w-full flex items-center justify-between bg-transparent px-5 py-2 ">
        <a href="/">
            <img src={logo} alt="Logo" className="h-20" />
        </a>
        <h1 className="m-0 text-4xl font-bold text-center font-outfit">
            <span className="text-green-400">99</span>
            <span className="text-black drop-shadow-[0_0_1px_white]">Bricks</span>
        </h1>
        <button className="px-5 py-2 bg-black text-white rounded-md hover:bg-green-600 font-outfit">
            Get Started
        </button>
    </div>
)
}

export default HomeNav