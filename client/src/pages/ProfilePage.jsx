import React from 'react'
import {useAuth} from "../contexts/AuthContext"

function ProfilePage() {
  const {currentUser} = useAuth()
  return (
    <div>
      Name : {currentUser.name} <br />
      Email : {currentUser.email} <br />
      Department : {currentUser.department?.name} <br />
      Role : {currentUser.role}
    </div>
  )
}

export default ProfilePage
