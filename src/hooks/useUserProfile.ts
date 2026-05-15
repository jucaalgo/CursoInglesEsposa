import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, saveProfile } from '../services/repository';
import { Profile } from '../types';

export function useUserProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Track the user ID that corresponds to the current in-flight request
    // so stale responses never overwrite fresh ones.
    const currentUserRef = useRef<string | null>(null);

    const loadProfile = useCallback(async (signal?: AbortSignal) => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            setError(null);
            return;
        }

        const userId = user.id;
        currentUserRef.current = userId;

        try {
            setLoading(true);
            setError(null);
            const data = await getProfile(userId);

            // If the component unmounted or user changed, discard the result.
            if (signal?.aborted) return;

            // Only apply results if the user hasn't changed since the request started.
            if (currentUserRef.current !== userId) return;

            if (data) {
                setProfile(data);
            }
            // If data is null the profile stays null (signup fallback).
        } catch (err) {
            if (signal?.aborted) return;

            // Only surface errors for the current user.
            if (currentUserRef.current !== userId) return;

            const message = err instanceof Error ? err.message : 'Failed to load profile';
            setError(message);
        } finally {
            if (!signal?.aborted && currentUserRef.current === userId) {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        const controller = new AbortController();
        loadProfile(controller.signal);
        return () => {
            controller.abort();
        };
    }, [loadProfile]);

    const updateProfile = async (newProfile: Profile) => {
        if (!user) return;
        try {
            setError(null);
            const profileToSave = { ...newProfile, username: user.id };
            await saveProfile(user.id, profileToSave);
            setProfile(profileToSave);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save profile';
            setError(message);
            throw err;
        }
    };

    return {
        profile,
        loading,
        error,
        updateProfile,
        refresh: () => loadProfile()
    };
}