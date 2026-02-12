import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, saveProfile } from '../services/repository';
import { Profile } from '../types';

export function useUserProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProfile = async () => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await getProfile(user.id);
            if (data) {
                setProfile(data);
            } else {
                // Should not happen if signup creates it, but handle fallback?
                // For now, return null
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, [user]);

    const updateProfile = async (newProfile: Profile) => {
        if (!user) return;
        try {
            // Ensure we update the profile for the current user
            const profileToSave = { ...newProfile, username: user.id };
            await saveProfile(user.id, profileToSave);
            setProfile(profileToSave);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save profile');
            throw err;
        }
    };

    return {
        profile,
        loading,
        error,
        updateProfile,
        refresh: loadProfile
    };
}

