import React, { useState } from 'react';
import './MembersTable.css';
import SavingsPlan from './SavingsPlan';

const MembersTable = ({ members, setMembers, settings, users, setUsers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [editingMember, setEditingMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  const [viewingSavingsPlan, setViewingSavingsPlan] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    dni: '',
    shares: 10,
    phone: '',
    email: '',
    username: '',
    password: ''
  });

  const getCreditRatingInfo = (rating) => {
    switch(rating) {
      case 'green':
        return { label: 'Excelente', icon: '🟢', class: 'excellent' };
      case 'yellow':
        return { label: 'Regular', icon: '🟡', class: 'regular' };
      case 'red':
        return { label: 'Observado', icon: '🔴', class: 'poor' };
      default:
        return { label: 'Sin calificar', icon: '⚪', class: 'unrated' };
    }
  };

  const filteredAndSortedMembers = React.useMemo(() => {
    let filtered = members.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRating = ratingFilter === 'all' || member.creditRating === ratingFilter;
      return matchesSearch && matchesRating;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [members, searchTerm, ratingFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '⬆️' : '⬇️';
  };

  const handleEditMember = (member) => {
    setEditingMember({ ...member });
  };

  const handleSaveMember = () => {
    setMembers(prev => prev.map(member => 
      member.id === editingMember.id ? editingMember : member
    ));
    setEditingMember(null);
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
  };

  const handleAddMember = () => {
    // Validaciones básicas
    if (!newMember.name || !newMember.dni || !newMember.username || !newMember.password) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    // Verificar que el DNI no exista
    if (members.find(m => m.dni === newMember.dni)) {
      alert('Ya existe un miembro con este DNI');
      return;
    }

    // Verificar que el username no exista
    if (users.find(u => u.username === newMember.username)) {
      alert('Ya existe un usuario con este nombre de usuario');
      return;
    }

    // Generar nuevo ID para el miembro
    const newMemberId = Math.max(...members.map(m => m.id), 0) + 1;
    
    // Crear nuevo miembro
    const memberToAdd = {
      id: newMemberId,
      name: newMember.name,
      dni: newMember.dni,
      shares: newMember.shares || 10,
      phone: newMember.phone,
      email: newMember.email,
      creditRating: 'green',
      creditScore: 90, // Nuevo miembro empieza con puntaje excelente
      savingsPlan: {
        enabled: true,
        planDays: 180,
        startDate: new Date().toISOString().split('T')[0],
        TEA: 0.02
      }
    };

    // Crear nuevo usuario asociado
    const newUserId = Math.max(...users.map(u => u.id), 0) + 1;
    const userToAdd = {
      id: newUserId,
      username: newMember.username,
      password: newMember.password,
      role: 'member',
      name: newMember.name,
      memberId: newMemberId
    };

    // Actualizar los estados
    setMembers([...members, memberToAdd]);
    setUsers([...users, userToAdd]);

    // Limpiar formulario y cerrar modal
    setNewMember({
      name: '',
      dni: '',
      shares: 10,
      phone: '',
      email: '',
      username: '',
      password: ''
    });
    setShowAddMemberModal(false);

    alert(`Miembro y usuario creados exitosamente\nUsuario: ${newMember.username}\nContraseña: ${newMember.password}`);
  };

  const handleCancelAddMember = () => {
    setNewMember({
      name: '',
      dni: '',
      shares: 10,
      phone: '',
      email: '',
      username: '',
      password: ''
    });
    setShowAddMemberModal(false);
  };

  const handleDeleteUser = (memberId, memberName) => {
    const userToDelete = users?.find(u => u.memberId === memberId);
    
    if (!userToDelete) {
      alert('No se encontró un usuario asociado a este miembro.');
      return;
    }

    if (userToDelete.role === 'admin') {
      alert('No se puede eliminar un usuario administrador.');
      return;
    }

    const confirmation = window.confirm(
      `¿Estás seguro de que deseas eliminar el usuario "${userToDelete.username}" asociado a ${memberName}?\n\n` +
      `Esta acción eliminará el acceso al sistema pero el miembro seguirá existiendo.\n\n` +
      `Esta acción NO se puede deshacer.`
    );

    if (confirmation) {
      const updatedUsers = users.filter(u => u.id !== userToDelete.id);
      setUsers(updatedUsers);
      alert(`Usuario "${userToDelete.username}" eliminado exitosamente.\n${memberName} ya no podrá acceder al sistema.`);
    }
  };

  const updateCreditRating = (memberId, newRating) => {
    // Calcular nuevo puntaje crediticio basado en la evaluación
    const getScoreFromRating = (rating) => {
      switch(rating) {
        case 'green': return Math.floor(Math.random() * 21) + 70; // 70-90 (Verde/Excelente)
        case 'yellow': return Math.floor(Math.random() * 30) + 40; // 40-69 (Amarillo/Regular)
        case 'red': return Math.floor(Math.random() * 40); // 0-39 (Rojo/Riesgo)
        default: return 90;
      }
    };

    const newCreditScore = getScoreFromRating(newRating);

    setMembers(prev => prev.map(member => 
      member.id === memberId ? { 
        ...member, 
        creditRating: newRating,
        creditScore: newCreditScore
      } : member
    ));
  };

  const calculateTotalGuarantee = () => {
    return members.reduce((total, member) => total + (member.shares * (settings?.shareValue || 500)), 0);
  };

  const handleBuyShares = (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const sharesStr = prompt(
      `${member.name} tiene actualmente ${member.shares} acciones.\n\n` +
      `Valor por acción: S/ ${settings?.shareValue || 500}\n\n` +
      `¿Cuántas acciones adicionales desea comprar?`
    );

    if (sharesStr === null) return;

    const additionalShares = parseInt(sharesStr);
    if (isNaN(additionalShares) || additionalShares <= 0) {
      alert('Por favor ingrese un número válido de acciones.');
      return;
    }

    const totalCost = additionalShares * (settings?.shareValue || 500);
    const confirm = window.confirm(
      `Confirmar compra de acciones:\n\n` +
      `Miembro: ${member.name}\n` +
      `Acciones a comprar: ${additionalShares}\n` +
      `Costo total: S/ ${totalCost.toLocaleString()}\n` +
      `Acciones actuales: ${member.shares}\n` +
      `Acciones después de la compra: ${member.shares + additionalShares}\n\n` +
      `¿Desea continuar?`
    );

    if (confirm) {
      setMembers(prev => prev.map(m => 
        m.id === memberId 
          ? { ...m, shares: m.shares + additionalShares }
          : m
      ));
      alert(`✅ Compra exitosa!\n${member.name} ahora tiene ${member.shares + additionalShares} acciones.`);
    }
  };

  // Calcular garantía dinámica basada en acciones
  const calculateGuarantee = (member) => {
    return member.shares * (settings?.shareValue || 500);
  };

  const handleCreditRatingChange = (memberId, newRating) => {
    // Calcular nuevo puntaje crediticio basado en la evaluación
    const getScoreFromRating = (rating) => {
      switch(rating) {
        case 'green': return Math.floor(Math.random() * 30) + 61; // 61-90
        case 'yellow': return Math.floor(Math.random() * 30) + 31; // 31-60
        case 'red': return Math.floor(Math.random() * 30) + 1; // 1-30
        default: return 50;
      }
    };

    const newCreditScore = getScoreFromRating(newRating);

    setMembers(members.map(member => 
      member.id === memberId ? { 
        ...member, 
        creditRating: newRating,
        creditScore: newCreditScore
      } : member
    ));

    // Actualizar también el miembro que se está viendo
    if (viewingMember && viewingMember.id === memberId) {
      setViewingMember(prev => ({
        ...prev,
        creditRating: newRating,
        creditScore: newCreditScore
      }));
    }
  };

  const getRatingCounts = () => {
    return {
      green: members.filter(m => m.creditRating === 'green').length,
      yellow: members.filter(m => m.creditRating === 'yellow').length,
      red: members.filter(m => m.creditRating === 'red').length
    };
  };

  const ratingCounts = getRatingCounts();

  return (
    <div className="members-table-container">
      <div className="members-header">
        <h2>👥 Gestión de Miembros</h2>
        <div className="members-summary">
          <div className="summary-stat">
            <span className="stat-label">Total miembros:</span>
            <span className="stat-value">{members.length}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Garantía total:</span>
            <span className="stat-value">S/ {calculateTotalGuarantee().toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="rating-summary">
        <div className="rating-card excellent">
          <div className="rating-icon">🟢</div>
          <div className="rating-content">
            <div className="rating-count">{ratingCounts.green}</div>
            <div className="rating-label">Excelente</div>
          </div>
        </div>
        <div className="rating-card regular">
          <div className="rating-icon">🟡</div>
          <div className="rating-content">
            <div className="rating-count">{ratingCounts.yellow}</div>
            <div className="rating-label">Regular</div>
          </div>
        </div>
        <div className="rating-card poor">
          <div className="rating-icon">🔴</div>
          <div className="rating-content">
            <div className="rating-count">{ratingCounts.red}</div>
            <div className="rating-label">Observado</div>
          </div>
        </div>
      </div>

      <div className="members-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar miembro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-box">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="rating-filter"
          >
            <option value="all">Todas las calificaciones</option>
            <option value="green">🟢 Excelente</option>
            <option value="yellow">🟡 Regular</option>
            <option value="red">🔴 Observado</option>
          </select>
        </div>

        <div className="add-member-section">
          <button 
            className="add-member-btn"
            onClick={() => setShowAddMemberModal(true)}
            title="Agregar nuevo miembro"
          >
            👤➕ Agregar Miembro
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="members-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                Nombre {getSortIcon('name')}
              </th>
              <th onClick={() => handleSort('dni')} className="sortable">
                DNI {getSortIcon('dni')}
              </th>
              <th onClick={() => handleSort('shares')} className="sortable">
                Acciones {getSortIcon('shares')}
              </th>
              <th onClick={() => handleSort('guarantee')} className="sortable">
                Garantía {getSortIcon('guarantee')}
              </th>
              <th>Calificación Crediticia</th>
              <th>Contacto</th>
              <th>Límite Préstamo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedMembers.map(member => {
              const ratingInfo = getCreditRatingInfo(member.creditRating);
              const dynamicGuarantee = calculateGuarantee(member);
              const loanLimit = Math.min(settings?.loanLimits?.individual || 8000, dynamicGuarantee * 0.8);
              
              return (
                <tr key={member.id} className={`member-row ${ratingInfo.class}`}>
                  <td className="member-name">
                    <div className="name-info">
                      <span className="name">{member.name}</span>
                      <span className="id">ID: {member.id}</span>
                    </div>
                  </td>
                  <td className="member-dni">
                    {member.dni}
                  </td>
                  <td className="shares">
                    <div className="shares-info">
                      <span className="shares-count">{member.shares}</span>
                      <span className="shares-label">acciones</span>
                    </div>
                  </td>
                  <td className="guarantee">
                    S/ {dynamicGuarantee.toLocaleString()}
                  </td>
                  <td className="credit-rating">
                    <div className="rating-display">
                      <span className={`rating-badge ${ratingInfo.class}`}>
                        {ratingInfo.icon} {ratingInfo.label}
                      </span>
                      <div className="rating-actions">
                        <button 
                          className="rating-btn green"
                          onClick={() => updateCreditRating(member.id, 'green')}
                          title="Marcar como Excelente"
                        >
                          🟢
                        </button>
                        <button 
                          className="rating-btn yellow"
                          onClick={() => updateCreditRating(member.id, 'yellow')}
                          title="Marcar como Regular"
                        >
                          🟡
                        </button>
                        <button 
                          className="rating-btn red"
                          onClick={() => updateCreditRating(member.id, 'red')}
                          title="Marcar como Observado"
                        >
                          🔴
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="contact">
                    <div className="contact-info">
                      <div className="phone">📞 {member.phone}</div>
                      <div className="email">📧 {member.email}</div>
                    </div>
                  </td>
                  <td className="loan-limit">
                    <div className="limit-info">
                      <span className="limit-amount">S/ {loanLimit.toLocaleString()}</span>
                      <span className="limit-percentage">(80% garantía)</span>
                    </div>
                  </td>
                  <td className="actions">
                    <button 
                      className="action-btn edit" 
                      onClick={() => handleEditMember(member)}
                      title="Editar miembro"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn view" 
                      onClick={() => setViewingMember(member)}
                      title="Ver detalles"
                    >
                      👁️
                    </button>
                    <button 
                      className="action-btn savings" 
                      onClick={() => setViewingSavingsPlan(member)}
                      title="Ver plan de ahorro"
                    >
                      💰
                    </button>
                    {users?.find(u => u.memberId === member.id) && (
                      <button 
                        className="action-btn delete-user" 
                        onClick={() => handleDeleteUser(member.id, member.name)}
                        title="Eliminar usuario del sistema"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredAndSortedMembers.length === 0 && (
          <div className="no-results">
            <div className="no-results-icon">👥</div>
            <h3>No se encontraron miembros</h3>
            <p>Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </div>

      {editingMember && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="modal-header">
              <h3>✏️ Editar Miembro</h3>
              <button className="close-btn" onClick={handleCancelEdit}>❌</button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={editingMember.name}
                  onChange={(e) => setEditingMember(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              
              <div className="form-group">
                <label>DNI:</label>
                <input
                  type="text"
                  value={editingMember.dni}
                  onChange={(e) => setEditingMember(prev => ({...prev, dni: e.target.value}))}
                  maxLength="8"
                />
              </div>
              
              <div className="form-group">
                <label>Acciones:</label>
                <input
                  type="number"
                  value={editingMember.shares}
                  onChange={(e) => setEditingMember(prev => ({...prev, shares: parseInt(e.target.value) || 0}))}
                />
              </div>
              
              <div className="form-group">
                <label>Garantía (S/):</label>
                <input
                  type="number"
                  value={editingMember.guarantee}
                  onChange={(e) => setEditingMember(prev => ({...prev, guarantee: parseInt(e.target.value) || 0}))}
                />
              </div>
              
              <div className="form-group">
                <label>Teléfono:</label>
                <input
                  type="text"
                  value={editingMember.phone}
                  onChange={(e) => setEditingMember(prev => ({...prev, phone: e.target.value}))}
                />
              </div>
              
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={editingMember.email}
                  onChange={(e) => setEditingMember(prev => ({...prev, email: e.target.value}))}
                />
              </div>
              
              <div className="form-group">
                <label>Puntaje Crediticio (0-90):</label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={editingMember.creditScore || 90}
                  onChange={(e) => {
                    const score = parseInt(e.target.value) || 0;
                    const clampedScore = Math.max(0, Math.min(90, score));
                    let newRating = 'red';
                    if (clampedScore >= 70) newRating = 'green';
                    else if (clampedScore >= 40) newRating = 'yellow';
                    
                    setEditingMember(prev => ({
                      ...prev, 
                      creditScore: clampedScore,
                      creditRating: newRating
                    }));
                  }}
                />
                <small className="score-indicator">
                  {editingMember.creditScore >= 70 && '🟢 Excelente (70-90)'}
                  {editingMember.creditScore >= 40 && editingMember.creditScore < 70 && '🟡 Regular (40-69)'}
                  {editingMember.creditScore < 40 && '🔴 Riesgo (0-39)'}
                </small>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="save-btn" onClick={handleSaveMember}>
                💾 Guardar
              </button>
              <button className="cancel-btn" onClick={handleCancelEdit}>
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingMember && (
        <div className="view-modal-overlay">
          <div className="view-modal">
            <div className="view-modal-header">
              <div className="member-title">
                <div className="member-avatar">
                  {viewingMember.name.charAt(0).toUpperCase()}
                </div>
                <div className="member-basic-info">
                  <h2>{viewingMember.name}</h2>
                  <p className="member-subtitle">Miembro ID: {viewingMember.id}</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setViewingMember(null)}>×</button>
            </div>
            
            <div className="view-modal-content">
              {/* Información Personal */}
              <div className="info-section">
                <div className="section-header">
                  <div className="section-icon">👤</div>
                  <h3>Información Personal</h3>
                </div>
                <div className="info-grid">
                  <div className="info-card">
                    <div className="info-label">Nombre Completo</div>
                    <div className="info-value">{viewingMember.name}</div>
                  </div>
                  <div className="info-card">
                    <div className="info-label">DNI</div>
                    <div className="info-value">{viewingMember.dni}</div>
                  </div>
                  <div className="info-card">
                    <div className="info-label">Teléfono</div>
                    <div className="info-value">{viewingMember.phone}</div>
                  </div>
                  <div className="info-card">
                    <div className="info-label">Email</div>
                    <div className="info-value">{viewingMember.email}</div>
                  </div>
                </div>
              </div>

              {/* Credenciales de Acceso */}
              {(() => {
                const memberUser = users?.find(u => u.memberId === viewingMember.id);
                return memberUser ? (
                  <div className="info-section">
                    <div className="section-header">
                      <div className="section-icon">🔐</div>
                      <h3>Credenciales de Acceso al Sistema</h3>
                    </div>
                    <div className="credentials-grid">
                      <div className="credential-card">
                        <div className="credential-label">Usuario</div>
                        <div className="credential-value">
                          <span className="credential-text">{memberUser.username}</span>
                          <button 
                            className="copy-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(memberUser.username);
                              alert('Usuario copiado al portapapeles');
                            }}
                            title="Copiar usuario"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="credential-card">
                        <div className="credential-label">Contraseña</div>
                        <div className="credential-value">
                          <span className="credential-text">{memberUser.password}</span>
                          <button 
                            className="copy-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(memberUser.password);
                              alert('Contraseña copiada al portapapeles');
                            }}
                            title="Copiar contraseña"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="credential-card full-width">
                        <div className="credential-label">Acceso Completo</div>
                        <div className="credential-value">
                          <span className="credential-text">{memberUser.username} / {memberUser.password}</span>
                          <button 
                            className="copy-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(`${memberUser.username} / ${memberUser.password}`);
                              alert('Credenciales completas copiadas al portapapeles');
                            }}
                            title="Copiar usuario y contraseña"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="credentials-note">
                      <span className="note-icon">💡</span>
                      <span className="note-text">
                        Estas credenciales permiten al miembro acceder al sistema. 
                        Se recomienda que el usuario cambie su contraseña después del primer acceso.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="info-section">
                    <div className="section-header">
                      <div className="section-icon">⚠️</div>
                      <h3>Credenciales de Acceso</h3>
                    </div>
                    <div className="no-credentials">
                      <p>Este miembro no tiene credenciales de acceso al sistema.</p>
                      <p>Se recomienda crear un usuario asociado para que pueda acceder al sistema.</p>
                    </div>
                  </div>
                );
              })()}

              {/* Información Financiera */}
              <div className="info-section">
                <div className="section-header">
                  <div className="section-icon">💰</div>
                  <h3>Información Financiera</h3>
                </div>
                <div className="info-grid">
                  <div className="info-card highlight">
                    <div className="info-label">Acciones</div>
                    <div className="info-value big">{viewingMember.shares}</div>
                    <div className="info-subtitle">S/ {(viewingMember.shares * (settings?.shareValue || 500)).toLocaleString()} total</div>
                  </div>
                  <div className="info-card highlight">
                    <div className="info-label">Garantía</div>
                    <div className="info-value big">S/ {calculateGuarantee(viewingMember).toLocaleString()}</div>
                    <div className="info-subtitle">Monto respaldado</div>
                  </div>
                  <div className="info-card highlight">
                    <div className="info-label">Límite de Préstamo</div>
                    <div className="info-value big">S/ {Math.min(settings?.loanLimits?.individual || 8000, calculateGuarantee(viewingMember) * 0.8).toLocaleString()}</div>
                    <div className="info-subtitle">80% de garantía (máx. S/ {(settings?.loanLimits?.individual || 8000).toLocaleString()})</div>
                  </div>
                </div>
              </div>

              {/* Calificación Crediticia */}
              <div className="info-section">
                <div className="section-header">
                  <div className="section-icon">📊</div>
                  <h3>Evaluación Crediticia</h3>
                </div>
                <div className="credit-info">
                  <div className="credit-rating-display">
                    <div className={`rating-circle ${getCreditRatingInfo(viewingMember.creditRating).class}`}>
                      <div className="rating-icon">{getCreditRatingInfo(viewingMember.creditRating).icon}</div>
                      <div className="rating-label">{getCreditRatingInfo(viewingMember.creditRating).label}</div>
                    </div>
                    <div className="rating-controls">
                      <label>Cambiar Evaluación:</label>
                      <select 
                        value={viewingMember.creditRating} 
                        onChange={(e) => handleCreditRatingChange(viewingMember.id, e.target.value)}
                        className="rating-select"
                      >
                        <option value="green">🟢 Excelente</option>
                        <option value="yellow">🟡 Regular</option>
                        <option value="red">🔴 Observado</option>
                      </select>
                    </div>
                    <div className="credit-score-info">
                      <div className="score-label">Puntaje Crediticio</div>
                      <div className="score-value">{viewingMember.creditScore}<span className="score-max">/90</span></div>
                      <div className="score-bar">
                        <div 
                          className="score-fill"
                          style={{
                            width: `${(viewingMember.creditScore / 90) * 100}%`,
                            backgroundColor: viewingMember.creditRating === 'green' ? '#28a745' : 
                                           viewingMember.creditRating === 'yellow' ? '#ffc107' : '#dc3545'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen de Estado */}
              <div className="info-section">
                <div className="section-header">
                  <div className="section-icon">📈</div>
                  <h3>Estado del Miembro</h3>
                </div>
                <div className="status-cards">
                  <div className="status-card">
                    <div className="status-icon">🏦</div>
                    <div className="status-label">Miembro Activo</div>
                    <div className="status-value">Desde 2023</div>
                  </div>
                  <div className="status-card">
                    <div className="status-icon">📋</div>
                    <div className="status-label">Utilización</div>
                    <div className="status-value">{Math.round((viewingMember.guarantee * 0.8 / viewingMember.guarantee) * 100)}%</div>
                  </div>
                  <div className="status-card">
                    <div className="status-icon">⚡</div>
                    <div className="status-label">Estado</div>
                    <div className="status-value">
                      {viewingMember.creditRating === 'green' ? 'Excelente' : 
                       viewingMember.creditRating === 'yellow' ? 'Regular' : 'Requiere Atención'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="view-modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setViewingMember(null)}
              >
                Cerrar
              </button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setEditingMember(viewingMember);
                  setViewingMember(null);
                }}
              >
                ✏️ Editar Miembro
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingSavingsPlan && (
        <div className="modal-overlay">
          <div className="modal savings-modal">
            <div className="modal-header">
              <h3>Plan de Ahorro - {viewingSavingsPlan.name}</h3>
              <button className="close-btn" onClick={() => setViewingSavingsPlan(null)}>❌</button>
            </div>
            <div className="modal-content">
              <SavingsPlan 
                guarantee={calculateGuarantee(viewingSavingsPlan)} 
                memberName={viewingSavingsPlan.name}
              />
            </div>
          </div>
        </div>
      )}

      {showAddMemberModal && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="modal-header">
              <h3>👤➕ Agregar Nuevo Miembro</h3>
              <button className="close-btn" onClick={handleCancelAddMember}>❌</button>
            </div>
            
            <div className="modal-content">
              <div className="form-section">
                <h4>📋 Información Personal</h4>
                <div className="form-group">
                  <label>Nombre Completo *:</label>
                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) => setNewMember(prev => ({...prev, name: e.target.value}))}
                    placeholder="Nombre completo del miembro"
                  />
                </div>
                
                <div className="form-group">
                  <label>DNI *:</label>
                  <input
                    type="text"
                    value={newMember.dni}
                    onChange={(e) => setNewMember(prev => ({...prev, dni: e.target.value}))}
                    maxLength="8"
                    placeholder="12345678"
                  />
                </div>
                
                <div className="form-group">
                  <label>Teléfono:</label>
                  <input
                    type="text"
                    value={newMember.phone}
                    onChange={(e) => setNewMember(prev => ({...prev, phone: e.target.value}))}
                    placeholder="987654321"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({...prev, email: e.target.value}))}
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>💰 Información Financiera</h4>
                <div className="form-group">
                  <label>Acciones Iniciales:</label>
                  <input
                    type="number"
                    value={newMember.shares}
                    onChange={(e) => setNewMember(prev => ({...prev, shares: parseInt(e.target.value) || 10}))}
                    min="1"
                    placeholder="10"
                  />
                  <small>Valor por acción: S/ {(settings?.shareValue || 500).toLocaleString()}</small>
                </div>
              </div>

              <div className="form-section">
                <h4>🔐 Credenciales de Acceso</h4>
                <div className="form-group">
                  <label>Nombre de Usuario *:</label>
                  <input
                    type="text"
                    value={newMember.username}
                    onChange={(e) => setNewMember(prev => ({...prev, username: e.target.value.toLowerCase()}))}
                    placeholder="usuario123"
                  />
                  <small>Solo letras minúsculas y números, sin espacios</small>
                </div>
                
                <div className="form-group">
                  <label>Contraseña *:</label>
                  <input
                    type="text"
                    value={newMember.password}
                    onChange={(e) => setNewMember(prev => ({...prev, password: e.target.value}))}
                    placeholder="contraseña123"
                  />
                  <small>El usuario podrá cambiar su contraseña después</small>
                </div>
              </div>

              <div className="member-preview">
                <h4>📊 Resumen del Nuevo Miembro</h4>
                <div className="preview-grid">
                  <div className="preview-item">
                    <span>Garantía inicial:</span>
                    <span>S/ {((newMember.shares || 10) * (settings?.shareValue || 500)).toLocaleString()}</span>
                  </div>
                  <div className="preview-item">
                    <span>Límite de préstamo:</span>
                    <span>S/ {Math.min(settings?.loanLimits?.individual || 8000, ((newMember.shares || 10) * (settings?.shareValue || 500)) * 0.8).toLocaleString()}</span>
                  </div>
                  <div className="preview-item">
                    <span>Calificación inicial:</span>
                    <span>🟢 Excelente (90/90)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="save-btn" onClick={handleAddMember}>
                👤➕ Crear Miembro y Usuario
              </button>
              <button className="cancel-btn" onClick={handleCancelAddMember}>
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-footer">
        <div className="results-count">
          Mostrando {filteredAndSortedMembers.length} de {members.length} miembros
        </div>
      </div>
    </div>
  );
};

export default MembersTable;