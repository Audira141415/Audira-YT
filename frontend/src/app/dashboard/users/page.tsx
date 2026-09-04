"use client"

import React, { useState, useEffect } from "react"
import { 
  Users, Crown, Shield, ShieldCheck, UserCheck, Eye, 
  Search, Plus, RefreshCw, Trash2, Key, Edit3, X, Check, 
  AlertCircle, Lock, Mail, User, Sparkles, Filter, ChevronDown, CheckCircle2
} from "lucide-react"
import { getApiBaseUrl, fetchWithFallback, fetchWithAuth } from "@/lib/api"

interface UserItem {
  id: string
  name: string
  email: string
  role: "SUPERADMIN" | "ADMIN" | "MANAGER" | "VIEWER"
  status: "ACTIVE" | "SUSPENDED"
  has_password: boolean
  created_at: string
  initials: string
  role_info?: {
    title: string
    badge: string
    color: string
    description: string
    permissions: string[]
  }
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [stats, setStats] = useState<any>({
    total: 0,
    superadmin_count: 0,
    admin_count: 0,
    manager_count: 0,
    viewer_count: 0,
    active_count: 0,
    suspended_count: 0
  })
  const [roleMatrix, setRoleMatrix] = useState<any>({})
  const [loading, setLoading] = useState(true)
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetPassModal, setShowResetPassModal] = useState(false)
  const [showRoleGuideModal, setShowRoleGuideModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  
  // Form States
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState<"SUPERADMIN" | "ADMIN" | "MANAGER" | "VIEWER">("MANAGER")
  const [newStatus, setNewStatus] = useState<"ACTIVE" | "SUSPENDED">("ACTIVE")
  
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState<"SUPERADMIN" | "ADMIN" | "MANAGER" | "VIEWER">("MANAGER")
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "SUSPENDED">("ACTIVE")
  
  const [resetPasswordVal, setResetPasswordVal] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const [res, roleRes] = await Promise.all([
        fetchWithFallback("/users"),
        fetchWithFallback("/users/roles")
      ])
      
      if (res && res.ok) {
        const data = await res.json().catch(() => null)
        if (data) {
          setUsers(data.users || [])
          setStats(data.stats || {})
        }
      }
      
      if (roleRes && roleRes.ok) {
        const roleData = await roleRes.json().catch(() => null)
        if (roleData) {
          setRoleMatrix(roleData.roles || {})
        }
      }
    } catch (err) {
      console.error("Failed to fetch registered users", err)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(true)
  }, [])

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
      
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  })

  // Register New User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || !newPassword) {
      alert("Email dan Kata Sandi wajib diisi!")
      return
    }

    try {
      setSubmitting(true)
      const res = await fetchWithAuth(`${getApiBaseUrl()}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName || newEmail.split("@")[0],
          email: newEmail,
          password: newPassword,
          role: newRole,
          status: newStatus
        })
      })

      if (res.ok) {
        const data = await res.json()
        alert(`🎉 Berhasil! ${data.message || "Pengguna baru berhasil didaftarkan."}`)
        setShowAddModal(false)
        setNewName("")
        setNewEmail("")
        setNewPassword("")
        setNewRole("MANAGER")
        fetchUsers(false)
      } else {
        const errData = await res.json()
        alert(errData.detail || "Gagal mendaftarkan pengguna.")
      }
    } catch (err) {
      console.error(err)
      alert("Terjadi kesalahan koneksi server.")
    } finally {
      setSubmitting(false)
    }
  }

  // Quick Role Change Handler
  const handleQuickRoleChange = async (userId: string, newRoleVal: string) => {
    try {
      const res = await fetchWithAuth(`${getApiBaseUrl()}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRoleVal })
      })

      if (res.ok) {
        fetchUsers(false)
      } else {
        const err = await res.json()
        alert(err.detail || "Gagal mengubah role pengguna.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Quick Status Toggle Handler
  const handleToggleStatus = async (user: UserItem) => {
    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
    try {
      const res = await fetchWithAuth(`${getApiBaseUrl()}/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      })

      if (res.ok) {
        fetchUsers(false)
      } else {
        const err = await res.json()
        alert(err.detail || "Gagal mengubah status pengguna.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Edit User Details
  const handleOpenEdit = (user: UserItem) => {
    setSelectedUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditRole(user.role)
    setEditStatus(user.status)
    setShowEditModal(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      setSubmitting(true)
      const res = await fetchWithAuth(`${getApiBaseUrl()}/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
          status: editStatus
        })
      })

      if (res.ok) {
        alert("Data pengguna berhasil diperbarui!")
        setShowEditModal(false)
        fetchUsers(false)
      } else {
        const err = await res.json()
        alert(err.detail || "Gagal memperbarui pengguna.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // Reset Password Handler
  const handleOpenResetPass = (user: UserItem) => {
    setSelectedUser(user)
    setResetPasswordVal("")
    setShowResetPassModal(true)
  }

  const handleSaveResetPass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !resetPasswordVal) {
      alert("Masukkan kata sandi baru!")
      return
    }

    try {
      setSubmitting(true)
      const res = await fetchWithAuth(`${getApiBaseUrl()}/users/${selectedUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: resetPasswordVal })
      })

      if (res.ok) {
        alert(`Kata sandi untuk '${selectedUser.name}' berhasil di-reset!`)
        setShowResetPassModal(false)
        setResetPasswordVal("")
      } else {
        const err = await res.json()
        alert(err.detail || "Gagal mereset kata sandi.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete User Handler
  const handleDeleteUser = async (user: UserItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun '${user.name}' (${user.email})? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    try {
      const res = await fetchWithAuth(`${getApiBaseUrl()}/users/${user.id}`, {
        method: "DELETE"
      })

      if (res.ok) {
        alert("Akun pengguna berhasil dihapus.")
        fetchUsers(false)
      } else {
        const err = await res.json()
        alert(err.detail || "Gagal menghapus pengguna.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return <span className="bg-yellow-300 text-black border-2 border-black font-black text-[9px] px-2.5 py-0.5 uppercase shadow-[1px_1px_0_0_#000] flex items-center gap-1"><Crown className="w-3 h-3 text-black fill-current" /> SUPERADMIN</span>
      case "ADMIN":
        return <span className="bg-emerald-300 text-black border-2 border-black font-black text-[9px] px-2.5 py-0.5 uppercase shadow-[1px_1px_0_0_#000] flex items-center gap-1"><Shield className="w-3 h-3 text-black" /> ADMIN</span>
      case "MANAGER":
        return <span className="bg-cyan-200 text-black border-2 border-black font-black text-[9px] px-2.5 py-0.5 uppercase shadow-[1px_1px_0_0_#000] flex items-center gap-1"><UserCheck className="w-3 h-3 text-black" /> MANAGER</span>
      case "VIEWER":
        return <span className="bg-purple-200 text-black border-2 border-black font-black text-[9px] px-2.5 py-0.5 uppercase shadow-[1px_1px_0_0_#000] flex items-center gap-1"><Eye className="w-3 h-3 text-black" /> VIEWER</span>
      default:
        return <span className="bg-gray-200 text-black border border-black text-[9px] font-bold px-2 py-0.5">{role}</span>
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-8">
      
      {/* Top Banner Header */}
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-[8px_8px_0_0_#000] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-black text-yellow-300 font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-yellow-300 fill-current"/> ROLE-BASED ACCESS CONTROL (RBAC)
            </span>
            <span className="bg-white text-black font-black px-2.5 py-0.5 text-[10px] uppercase border border-black shadow-[2px_2px_0_0_#000]">
              DATABASE USER MANAGEMENT
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-black tracking-tighter uppercase leading-none text-black">
            MANAJEMEN AKUN & HAK AKSES ROLE
          </h1>
          <p className="text-xs font-bold text-gray-800 mt-2 max-w-3xl leading-relaxed">
            Kelola seluruh akun yang berhasil terdaftar di database, tetapkan tingkatan hak akses (*Superadmin, Admin, Manager, Viewer*), reset kata sandi, dan lindungi kredensial sensitif.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <button 
            onClick={() => setShowRoleGuideModal(true)}
            className="bg-white text-black font-black px-4 py-3 border-2 border-black flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 text-xs uppercase"
          >
            <ShieldCheck className="w-4 h-4 text-purple-700" /> PANDUAN ROLE
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-black text-yellow-300 font-black px-5 py-3 border-2 border-black flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 text-xs uppercase"
          >
            <Plus className="w-4 h-4 text-yellow-300" /> DAFTARKAN PENGGUNA BARU
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Users */}
        <div className="bg-white border-4 border-black p-4 shadow-[5px_5px_0_0_#000] flex items-center gap-3">
          <div className="bg-yellow-300 p-3 border-2 border-black shadow-[2px_2px_0_0_#000]">
            <Users className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-gray-500">TOTAL AKUN TERDAFTAR</div>
            <div className="text-2xl font-black">{stats.total} PENGGUNA</div>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping inline-block" />
              {stats.active_count} Aktif &bull; {stats.suspended_count} Nonaktif
            </div>
          </div>
        </div>

        {/* Superadmins */}
        <div className="bg-white border-4 border-black p-4 shadow-[5px_5px_0_0_#000] flex items-center gap-3">
          <div className="bg-amber-400 p-3 border-2 border-black shadow-[2px_2px_0_0_#000]">
            <Crown className="w-6 h-6 text-black fill-current" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-gray-500">SUPERADMIN / OWNER</div>
            <div className="text-2xl font-black">{stats.superadmin_count} AKUN</div>
            <div className="text-[10px] text-gray-600 font-bold">Akses Total Sistem & Finansial</div>
          </div>
        </div>

        {/* Managers / Editors */}
        <div className="bg-white border-4 border-black p-4 shadow-[5px_5px_0_0_#000] flex items-center gap-3">
          <div className="bg-cyan-300 p-3 border-2 border-black shadow-[2px_2px_0_0_#000]">
            <UserCheck className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-gray-500">MANAGER & OPERATOR</div>
            <div className="text-2xl font-black">{(stats.admin_count || 0) + (stats.manager_count || 0)} AKUN</div>
            <div className="text-[10px] text-cyan-800 font-bold">Operasional Video & Komentar</div>
          </div>
        </div>

        {/* Viewers */}
        <div className="bg-white border-4 border-black p-4 shadow-[5px_5px_0_0_#000] flex items-center gap-3">
          <div className="bg-purple-300 p-3 border-2 border-black shadow-[2px_2px_0_0_#000]">
            <Eye className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-gray-500">CLIENT / VIEWER</div>
            <div className="text-2xl font-black">{stats.viewer_count} AKUN</div>
            <div className="text-[10px] text-purple-900 font-bold">Read-Only Analytics & Laporan</div>
          </div>
        </div>

      </div>

      {/* Main Table Container */}
      <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] flex flex-col">
        
        {/* Table Filter & Search Controls */}
        <div className="border-b-4 border-black p-4 bg-yellow-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* Role Filter Tabs */}
          <div className="flex gap-2 text-[11px] font-black uppercase overflow-x-auto w-full md:w-auto">
            {["ALL", "SUPERADMIN", "ADMIN", "MANAGER", "VIEWER"].map((tab) => (
              <button
                key={tab}
                onClick={() => setRoleFilter(tab)}
                className={`px-3 py-1.5 border-2 border-black transition-all ${
                  roleFilter === tab 
                    ? "bg-black text-yellow-300 shadow-[2px_2px_0_0_#000]" 
                    : "bg-white text-black hover:bg-gray-100 shadow-[1px_1px_0_0_#000]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau email pengguna..."
                className="w-full pl-9 pr-4 py-2 border-2 border-black font-bold text-xs bg-white focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button 
              onClick={() => fetchUsers(false)}
              className="bg-black text-yellow-300 font-black p-2.5 border-2 border-black shadow-[2px_2px_0_0_#000] hover:bg-gray-800 shrink-0"
              title="Refresh Data Pengguna"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Table Content */}
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black text-[10px] uppercase font-black tracking-wider text-black bg-gray-100">
                <th className="p-4 py-3.5">PROFIL PENGGUNA</th>
                <th className="p-4 py-3.5">HAK AKSES / PERAN (ROLE)</th>
                <th className="p-4 py-3.5">STATUS AKUN</th>
                <th className="p-4 py-3.5">TANGGAL REGISTRASI</th>
                <th className="p-4 py-3.5 text-center">TINDAKAN KELOLA</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center font-bold text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-black" />
                    Memuat daftar akun pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center font-bold text-gray-500 bg-gray-50">
                    Tidak ada akun pengguna yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b-2 border-black hover:bg-amber-50/50 transition-colors">
                    
                    {/* User Profile */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center font-black text-xs shadow-[2px_2px_0_0_#000] ${
                          user.role === 'SUPERADMIN' ? 'bg-yellow-300 text-black' :
                          user.role === 'ADMIN' ? 'bg-emerald-300 text-black' :
                          user.role === 'MANAGER' ? 'bg-cyan-200 text-black' : 'bg-purple-200 text-black'
                        }`}>
                          {user.initials || "US"}
                        </div>
                        <div>
                          <div className="font-black text-sm uppercase text-black leading-tight flex items-center gap-2">
                            <span>{user.name}</span>
                            {user.role === 'SUPERADMIN' && (
                              <Crown className="w-3.5 h-3.5 text-amber-500 fill-current inline-block" />
                            )}
                          </div>
                          <div className="text-xs font-mono font-bold text-gray-600 mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role Quick Selector */}
                    <td className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getRoleBadge(user.role)}
                        <select
                          value={user.role}
                          onChange={(e) => handleQuickRoleChange(user.id, e.target.value)}
                          className="bg-white border-2 border-black text-[10px] font-black px-2 py-1 shadow-[1.5px_1.5px_0_0_#000] focus:outline-none focus:bg-yellow-100 cursor-pointer"
                        >
                          <option value="SUPERADMIN">👑 SUPERADMIN</option>
                          <option value="ADMIN">🛡️ ADMIN</option>
                          <option value="MANAGER">🎬 MANAGER</option>
                          <option value="VIEWER">👁️ VIEWER</option>
                        </select>
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`px-3 py-1 border-2 border-black font-black text-[10px] uppercase shadow-[1.5px_1.5px_0_0_#000] transition-all flex items-center gap-1.5 ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-300 text-black hover:bg-emerald-400'
                            : 'bg-red-400 text-white hover:bg-red-500'
                        }`}
                        title="Klik untuk mengubah status aktif/nonaktif"
                      >
                        <span className={`w-2 h-2 rounded-full border border-black ${user.status === 'ACTIVE' ? 'bg-green-700 animate-ping' : 'bg-white'}`} />
                        {user.status === 'ACTIVE' ? 'AKTIF (ACTIVE)' : 'SUSPENDED'}
                      </button>
                    </td>

                    {/* Registered Date */}
                    <td className="p-4">
                      <div className="font-bold text-xs text-gray-800">{user.created_at}</div>
                      <div className="text-[10px] font-mono text-gray-500">ID: {user.id.substring(0, 8)}...</div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="bg-white text-black font-black p-2 border-2 border-black shadow-[1.5px_1.5px_0_0_#000] hover:bg-yellow-200 transition-colors"
                          title="Edit Informasi Pengguna"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Password Button */}
                        <button
                          onClick={() => handleOpenResetPass(user)}
                          className="bg-yellow-300 text-black font-black p-2 border-2 border-black shadow-[1.5px_1.5px_0_0_#000] hover:bg-yellow-400 transition-colors"
                          title="Reset Kata Sandi Akun"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="bg-red-500 text-white font-black p-2 border-2 border-black shadow-[1.5px_1.5px_0_0_#000] hover:bg-red-600 transition-colors"
                          title="Hapus Akun Pengguna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL: DAFTARKAN PENGGUNA BARU */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-xs">
          <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0_0_#000] max-w-md w-full relative">
            <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
              <h3 className="font-black text-lg uppercase flex items-center gap-2">
                <Users className="w-5 h-5"/> DAFTARKAN PENGGUNA BARU
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="bg-black text-white p-1 border-2 border-black hover:bg-gray-800"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase mb-1">NAMA LENGKAP PENGGUNA *</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full border-2 border-black p-2.5 text-xs font-bold focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase mb-1">EMAIL PENGGUNA (LOGIN) *</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Contoh: budi.editor@audira.com"
                  className="w-full border-2 border-black p-2.5 text-xs font-bold focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase mb-1">KATA SANDI AWAL *</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full border-2 border-black p-2.5 text-xs font-bold focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1">HAK AKSES (ROLE) *</label>
                  <select
                    value={newRole}
                    onChange={(e: any) => setNewRole(e.target.value)}
                    className="w-full border-2 border-black p-2.5 text-xs font-black bg-cyan-100 focus:outline-none shadow-[2px_2px_0_0_#000]"
                  >
                    <option value="SUPERADMIN">👑 SUPERADMIN</option>
                    <option value="ADMIN">🛡️ ADMIN</option>
                    <option value="MANAGER">🎬 MANAGER</option>
                    <option value="VIEWER">👁️ VIEWER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase mb-1">STATUS AWAL *</label>
                  <select
                    value={newStatus}
                    onChange={(e: any) => setNewStatus(e.target.value)}
                    className="w-full border-2 border-black p-2.5 text-xs font-black bg-emerald-100 focus:outline-none shadow-[2px_2px_0_0_#000]"
                  >
                    <option value="ACTIVE">🟢 AKTIF (ACTIVE)</option>
                    <option value="SUSPENDED">🔴 SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t-2 border-black">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-black text-yellow-300 font-black py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-gray-800 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4"/> {submitting ? "MENYIMPAN..." : "SIMPAN PENGGUNA"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-white text-black font-black px-4 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000]"
                >
                  BATAL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PENGGUNA */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-xs">
          <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0_0_#000] max-w-md w-full relative">
            <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
              <h3 className="font-black text-lg uppercase flex items-center gap-2">
                <Edit3 className="w-5 h-5"/> EDIT AKUN PENGGUNA
              </h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="bg-black text-white p-1 border-2 border-black hover:bg-gray-800"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase mb-1">NAMA LENGKAP</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border-2 border-black p-2.5 text-xs font-bold focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase mb-1">EMAIL LOGIN</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full border-2 border-black p-2.5 text-xs font-bold focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1">HAK AKSES (ROLE)</label>
                  <select
                    value={editRole}
                    onChange={(e: any) => setEditRole(e.target.value)}
                    className="w-full border-2 border-black p-2.5 text-xs font-black bg-cyan-100 focus:outline-none shadow-[2px_2px_0_0_#000]"
                  >
                    <option value="SUPERADMIN">👑 SUPERADMIN</option>
                    <option value="ADMIN">🛡️ ADMIN</option>
                    <option value="MANAGER">🎬 MANAGER</option>
                    <option value="VIEWER">👁️ VIEWER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase mb-1">STATUS</label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full border-2 border-black p-2.5 text-xs font-black bg-emerald-100 focus:outline-none shadow-[2px_2px_0_0_#000]"
                  >
                    <option value="ACTIVE">🟢 AKTIF (ACTIVE)</option>
                    <option value="SUSPENDED">🔴 SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t-2 border-black">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-black text-yellow-300 font-black py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-gray-800"
                >
                  {submitting ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-white text-black font-black px-4 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000]"
                >
                  BATAL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {showResetPassModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-xs">
          <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0_0_#000] max-w-md w-full relative">
            <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
              <h3 className="font-black text-lg uppercase flex items-center gap-2">
                <Key className="w-5 h-5"/> RESET KATA SANDI
              </h3>
              <button 
                onClick={() => setShowResetPassModal(false)}
                className="bg-black text-white p-1 border-2 border-black hover:bg-gray-800"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>

            <form onSubmit={handleSaveResetPass} className="space-y-4">
              <div className="bg-yellow-100 border-2 border-black p-3 text-xs font-bold">
                <div>Pengguna: <strong>{selectedUser.name}</strong></div>
                <div className="font-mono text-gray-700">{selectedUser.email}</div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase mb-1">KATA SANDI BARU *</label>
                <input 
                  type="password" 
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Masukkan minimal 4 karakter..."
                  className="w-full border-2 border-black p-2.5 text-xs font-bold focus:outline-none focus:bg-yellow-100 shadow-[2px_2px_0_0_#000]"
                  required
                  minLength={4}
                />
              </div>

              <div className="flex gap-3 pt-3 border-t-2 border-black">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-black text-yellow-300 font-black py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000] hover:bg-gray-800"
                >
                  {submitting ? "MENYIMPAN..." : "PERBARUI KATA SANDI"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetPassModal(false)}
                  className="bg-white text-black font-black px-4 py-3 border-2 border-black text-xs uppercase shadow-[3px_3px_0_0_#000]"
                >
                  BATAL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PANDUAN ROLE & MATRIX HAK AKSES */}
      {showRoleGuideModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-xs">
          <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0_0_#000] max-w-3xl w-full relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b-4 border-black">
              <h3 className="font-black text-xl uppercase flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-purple-700"/> MATRIKS HAK AKSES ROLE (RBAC GUIDE)
              </h3>
              <button 
                onClick={() => setShowRoleGuideModal(false)}
                className="bg-black text-white p-1.5 border-2 border-black hover:bg-gray-800"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(roleMatrix).map(([key, roleObj]: any) => (
                <div key={key} className="border-3 border-black p-4 bg-yellow-50 shadow-[3px_3px_0_0_#000]">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b-2 border-black">
                    <span className="font-black text-sm uppercase text-black flex items-center gap-2">
                      {roleObj.badge}
                    </span>
                    <span className="bg-black text-yellow-300 font-black text-[9px] px-2 py-0.5 border border-black uppercase">
                      LEVEL: {key}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-800 mb-3">{roleObj.description}</p>
                  <div className="space-y-1.5">
                    {roleObj.permissions?.map((perm: string, pIdx: number) => (
                      <div key={pIdx} className="text-xs font-bold text-gray-700 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowRoleGuideModal(false)}
                className="bg-black text-white font-black px-6 py-2.5 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_#000]"
              >
                TUTUP PANDUAN
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
