import { useState } from 'react';
import { useStudents } from '../context/StudentContext';
import { saveProfile } from '../services/repository';
import { Profile } from '../types';

export function useUserProfile() {
    const { activeStudent, isLoading, refreshStudents } = useStudents();
    const [error, setError] = useState<string | null>(null);

    const updateProfile = async (newProfile: Profile) => {
        try {
            if (!newProfile.username) throw new Error('Username missing in profile');
            await saveProfile(newProfile.username, newProfile);
            await refreshStudents();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save profile');
            throw err;
        }
    };

    return {
        profile: activeStudent,
        loading: isLoading,
        error: error,
        updateProfile,
        refresh: refreshStudents
    };
}
