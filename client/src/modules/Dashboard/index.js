import React, { useEffect, useRef, useState } from 'react'
// import Avtar from '../../assets/Avtar'
import Input from '../../components/Input'
import { io } from 'socket.io-client';
import './index.css'
const Dashboard = () => {


    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user:detail')));
    const [convo, setConvo] = useState([]);
    const [messages, setMessages] = useState({});
    const [message, setMessage] = useState('');
    const [users, setUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const messageRef = useRef(null);
    // console.log('user', user);
    // console.log('convo', convo);
    // console.log('resData', resData);
    // console.log('users', users);

    useEffect(() => {
        setSocket(io('http://localhost:8080'));
    }, [])

    // useEffect(() => {
    //     socket?.emit('addUser', user?.id);
    //     socket?.on('getUsers', users => {
    //         console.log('activeUsers', users);
    //     })
    //     socket?.on('getMessage', data => {
    //         setMessages(prev => ({
    //             ...prev,
    //             messages: [...prev.messages, { user: data.user, message: data.message }]
    //         }))
    //     })
    // }, [socket])

    useEffect(() => {
        socket?.emit('addUser', user?.id);
        socket?.on('getUsers', users => {
            console.log('activeUsers :>> ', users);
        })
        socket?.on('getMessage', data => {
            setMessages(prev => ({
                ...prev,
                messages: [...prev.messages, { user: data.user, message: data.message }]
            }))
        })
    }, [socket])

    useEffect(() => {
        messageRef?.current?.scrollIntoView({ behaviour: 'smooth' })
    }, [messages?.messages])

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user:detail'))
        const fetchConversations = async () => {
            const res = await fetch(`http://localhost:8000/api/conversation/${loggedInUser?.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const resData = await res.json();
            // console.log('resData', resData);
            setConvo(resData);
        }
        fetchConversations();
    }, [])

    useEffect(() => {
        const fetchUsers = async () => {
            const res = await fetch(`http://localhost:8000/api/users/${user?.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const resData = await res.json();
            setUsers(resData);
        }
        fetchUsers();
    }, [])

    const fetchMessages = async (conversationId, receiver) => {
        const res = await fetch(`http://localhost:8000/api/message/${conversationId}?senderId=${user?.id}&&receiverId=${receiver?.receiverId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const resData = await res.json();
        // console.log('resData', resData);
        setMessages({ messages: resData, receiver, conversationId })
    }

    const sedMessages = async (e) => {
        socket?.emit('sendMessage', {
            senderId: user?.id,
            receiverId: messages?.receiver?.receiverId,
            message,
            conversationId: messages?.conversationId
        });
        console.log('sendmessage', message, messages?.conversationId, user?.id, messages?.receiver?.receiverId);
        const res = fetch(`http://localhost:8000/api/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversationId: messages?.conversationId,
                senderId: user?.id,
                message,
                receiverId: messages?.receiver?.receiverId,
            })
        });
        // const resData = await res.json()
        // console.log("resData", resData);
        setMessage('');
    }


    return (
        <div className=' w-screen flex'>
            <div className=' w-[25%] h-screen bg-secondary overflow-scroll'>
                <div className=' flex  items-center my-8 mx-14'>
                    <div className=' border border-primary p-[2px] rounded-full'>
                        {/* <img src="" width={75} height={75} /> */}
                        <img width="75" height="75" src="https://img.icons8.com/color/48/circled-user-male-skin-type-3--v1.png" alt="circled-user-male-skin-type-3--v1" />
                    </div>
                    <div className=' ml-8'>
                        <h2 className='text-4xl text-[#f5f5f5]'>{user?.fullName}</h2>
                        <p className=' text-lg text-[#f5f5f5] '>{user?.email}</p>
                    </div>
                </div>

                <hr />

                <div className=' mx-14 mt-10'>
                    <div className=' message-wala'>Messages</div>
                    <div>
                        {
                            convo.length > 0 ?
                                convo.map(({ conversationId, user }) => {
                                    return (
                                        <div className=' flex items-center py-8 border-b border-b-[#505050]-300'>
                                            <div className=' cursor-pointer flex items-center' onClick={() => fetchMessages(conversationId, user)}>
                                                <div>
                                                    <img width="48" height="48" src="https://img.icons8.com/color/48/circled-user-female-skin-type-1-2--v1.png" alt="circled-user-female-skin-type-1-2--v1" />
                                                </div>
                                                <div className=' ml-8'>
                                                    <h3 className='text-lg text-[#f5f5f5]'>{user?.fullName}</h3>
                                                    <p className=' text-sm font-light text-[#f5f5f5]'>{user?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }) : <div className=' text-center text-lg font-semibold mt-24'>No conversations </div>
                        }
                    </div>
                </div>
            </div>
            <div className=' w-[50%] h-screen bg-[#fff] flex flex-col items-center'>
            <h2 className='top-heading'>Chat App</h2>
                {
                    messages?.receiver?.fullName &&
                    <div className=' w-[75%] bg-secondary h-[65px] mt-4 rounded-full flex items-center px-14'>
                        <div className=' cursor-pointer'>
                            <img width="48" height="48" src="https://img.icons8.com/color/48/circled-user-female-skin-type-1-2--v1.png" alt="circled-user-female-skin-type-1-2--v1" />
                        </div>
                        <div className=' ml-6 mr-auto'>
                            <h3 className='text-lg text-[#f5f5f5]'>{messages?.receiver?.fullName}</h3>
                            <p className=' text-sm text-[#f5f5f5]'>{messages?.receiver?.email}</p>
                        </div>
                        <div className=' cursor-pointer'>
                            <svg xmlns="http://www.w3.org/2000/svg" className="text-[#f5f5f5] icon icon-tabler icon-tabler-phone-outgoing" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" /><path d="M15 9l5 -5" /><path d="M16 4l4 0l0 4" /></svg>
                        </div>
                    </div>
                }
                <div className='h-[75%] w-full overflow-scroll shadow-sm'>
                    
                    <div className='p-14'>
                        {
                            messages?.messages?.length > 0 ?
                                messages.messages.map(({ message, user: { id } = {} }) => {
                                    return (
                                        <>
                                            <div className={` max-w-[40%] rounded-b-xl p-4 mb-6 ${id === user?.id ? 'bg-primary text-[#fff] rounded-tl-xl ml-auto'
                                                : 'bg-secondary rounded-tr-xl'}`}>{message}
                                            </div>
                                            <div ref={messageRef}></div>
                                        </>
                                    )
                                })
                                : <div className=' text-center text-lg font-semibold mt-24'> No Messages or No Conversation Selected </div>
                        }

                    </div>
                    {/* <div className=' p-14 w-full flex '>
                        <input type="text" placeholder='Type a message...' className=' w-[75%] ' inputClassName='p-4 border-0 mb-100 shadow-md rounded-full bg-light' />
                        <div className=' ml-4 p-2 cursor-pointer bg-ligt rounded-full'>
                            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-send" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 14l11 -11" /><path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" /></svg>
                        </div>
                        <div className=' ml-4 p-2 cursor-pointer bg-ligt rounded-full'>
                            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-plus" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                        </div>
                    </div> */}

                    {
                        messages?.receiver?.fullName &&
                        <div className='p-14 w-full flex items-center'>
                            <Input type="text" placeholder='Type a message...' value={message} onChange={(e) => setMessage(e.target.value)} className='w-[75%]' inputClassName='p-4 border-0 shadow-md rounded-full bg-light focus:ring-0 focus:border-0 outline-none' />
                            <div className='flex space-x-4'>
                                <div className={` ml-4 p-2 cursor-pointer bg-light rounded-full ${!message && 'pointer-events-none'} `} onClick={() => sedMessages()}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-send cursor-pointer" width="30" height="30" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <line x1="10" y1="14" x2="21" y2="3" />
                                        <path d="M21 3l-6.5 18a0.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a0.55 .55 0 0 1 0 -1l18 -6.5" />
                                    </svg>
                                </div>
                                <div className={` ml-4 p-2 cursor-pointer bg-light rounded-full ${!message && 'pointer-events-none'} `}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-circle-plus cursor-pointer" width="30" height="30" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <circle cx="12" cy="12" r="9" />
                                        <line x1="9" y1="12" x2="15" y2="12" />
                                        <line x1="12" y1="9" x2="12" y2="15" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    }


                </div>
            </div>
            <div className=' w-[25%] h-screen bg-dark px-10 py-16  overflow-scroll'>
                <div className=' people-wala'>People
                    <div>
                        {
                            users.length > 0 ?
                                users.map(({ userId, user }) => {
                                    return (
                                        <div className=' flex items-center py-8 border-b border-b-[#505050]-300'>
                                            <div className=' cursor-pointer flex items-center' onClick={() => fetchMessages('new', user)}>
                                                <div>
                                                    <img width="48" height="48" src="https://img.icons8.com/color/48/circled-user-female-skin-type-1-2--v1.png" alt="circled-user-female-skin-type-1-2--v1" />
                                                </div>
                                                <div className=' ml-8'>
                                                    <h3 className='text-lg'>{user?.fullName}</h3>
                                                    <p className=' text-sm font-light'>{user?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }) : <div className=' text-center text-lg font-semibold mt-24'>No conversations </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard