import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile } from '../types';
import { getAllProfiles, getProfile, saveProfile, deleteUserData } from '../services/repository';

interface StudentContextType {
    students: Profile[];
    activeStudent: Profile | null;
    isLoading: boolean;
    selectStudent: (username: string) => void;
    addStudent: (name: string) => Promise<void>;
    deleteStudent: (username: string) => Promise<void>;
    refreshStudents: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [students, setStudents] = useState<Profile[]>([]);
    const [activeStudent, setActiveStudent] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load students on mount
    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        setIsLoading(true);
        try {
            const profiles = await getAllProfiles();
            setStudents(profiles);

            // Restore last active student from localStorage
            const lastActive = localStorage.getItem('profesoria_active_student');
            if (lastActive && profiles.length > 0) {
                const found = profiles.find(p => p.username === lastActive);
                setActiveStudent(found || profiles[0]);
            } else if (profiles.length > 0) {
                setActiveStudent(profiles[0]);
            }
        } catch (error) {
            console.error('Failed to load students:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const selectStudent = (username: string) => {
        const student = students.find(s => s.username === username);
        if (student) {
            setActiveStudent(student);
            localStorage.setItem('profesoria_active_student', username);
            localStorage.setItem('profesoria_username', username); // For compatibility
        }
    };

    const addStudent = async (name: string) => {
        const username = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
        const newProfile: Profile = {
            username,
            name,
            current_level: 'A1',
            target_level: 'B2',
            xp_total: 0,
            streak_count: 0,
            interests: []
        };

        await saveProfile(username, newProfile);
        await loadStudents();
        selectStudent(username);
    };

    const deleteStudent = async (username: string) => {
        await deleteUserData(username);
        // If the deleted student was active, clear selection
        if (activeStudent?.username === username) {
            setActiveStudent(null);
            localStorage.removeItem('profesoria_active_student');
        }
        await loadStudents();
    };

    const refreshStudents = async () => {
        await loadStudents();
    };

    return (
        <StudentContext.Provider value={{
            students,
            activeStudent,
            isLoading,
            selectStudent,
            addStudent,
            deleteStudent,
            refreshStudents
        }}>
            {children}
        </StudentContext.Provider>
    );
};

export const useStudents = () => {
    const context = useContext(StudentContext);
    if (!context) {
        throw new Error('useStudents must be used within a StudentProvider');
    }
    return context;
};
