import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  async function fetchGroups() {
    setLoading(true);

    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        groups (*)
      `)
      .eq('user_id', user.id);

    if (error) {
      setError(error.message);
    } else {
      setGroups(data.map(m => m.groups).filter(Boolean));
      if (data.length === 1) {
        setCurrentGroup(data[0].groups);
      }
    }
    setLoading(false);
  }

  async function createGroup(name, wordsPerSession = 10) {
    if (!user?.id) {
      return { error: 'User not authenticated' };
    }
    
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name,
        words_per_session: wordsPerSession,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return { error };

    await supabase.from('group_members').insert({
      group_id: data.id,
      user_id: user.id,
      role: 'owner',
    });

    await fetchGroups();
    return { data };
  }

  async function joinGroup(inviteCode) {
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (groupError) return { error: 'Código de invitación no válido' };
    if (!groupData) return { error: 'Grupo no encontrado' };

    const { data: existingMembership } = await supabase
      .from('group_members')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingMembership) {
      return {
        error: 'Ya perteneces a un grupo',
        existingGroup: existingMembership.group_id,
        newGroup: groupData.id,
      };
    }

    const { error: joinError } = await supabase.from('group_members').insert({
      group_id: groupData.id,
      user_id: user.id,
      role: 'member',
    });

    if (joinError) return { error: joinError.message };

    await fetchGroups();
    return { data: groupData };
  }

  async function leaveGroup(groupId) {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    if (error) return { error };

    await fetchGroups();
    return { success: true };
  }

  async function updateGroup(groupId, updates) {
    const { error } = await supabase
      .from('groups')
      .update({
        name: updates.name,
        words_per_session: updates.words_per_session,
      })
      .eq('id', groupId);

    if (error) return { error };

    await fetchGroups();
    return { success: true };
  }

  return {
    groups,
    currentGroup,
    setCurrentGroup,
    loading,
    error,
    refetch: fetchGroups,
    createGroup,
    joinGroup,
    leaveGroup,
    updateGroup,
  };
}
