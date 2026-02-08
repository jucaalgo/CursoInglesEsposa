import { useState, useEffect } from 'react';
import { getProfile, saveProfile } from '../services/repository';
import { Profile } from '../types';

export function useUserProfile() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            // For now, hardcoding a username or fetching from local storage/auth
            const username = localStorage.getItem('profesoria_user') || 'guest';
            const data = await getProfile(username);
            setProfile(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (newProfile: Profile) => {
        try {
            if (!newProfile.username) throw new Error('Username missing in profile');
            await saveProfile(newProfile.username, newProfile);
            setProfile(newProfile);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save profile');
            throw err;
        }
    };

    return { profile, loading, error, updateProfile, refresh: loadProfile };
}
