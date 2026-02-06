import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './useAuth';

/**
 * Hook for fetching and managing questions from the question bank
 */
export const useQuestions = (options = {}) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    section,
    topicId,
    difficulty,
    count = 10,
    excludeAnswered = false,
  } = options;

  // Fetch questions based on criteria
  const fetchQuestions = useCallback(async (fetchOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const questionsRef = collection(db, 'content', 'questions', 'items');
      let constraints = [];

      // Apply filters
      if (fetchOptions.section || section) {
        constraints.push(where('section', '==', fetchOptions.section || section));
      }
      if (fetchOptions.topicId || topicId) {
        constraints.push(where('topicId', '==', fetchOptions.topicId || topicId));
      }
      if (fetchOptions.difficulty || difficulty) {
        constraints.push(where('difficulty', '==', fetchOptions.difficulty || difficulty));
      }

      constraints.push(limit(fetchOptions.count || count));

      const q = query(questionsRef, ...constraints);
      const snapshot = await getDocs(q);

      const fetchedQuestions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Shuffle questions for variety
      const shuffled = fetchedQuestions.sort(() => Math.random() - 0.5);
      
      setQuestions(shuffled);
      setCurrentIndex(0);
      
      return shuffled;
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [section, topicId, difficulty, count]);

  // Get single question by ID
  const getQuestion = useCallback(async (questionId) => {
    try {
      const questionRef = doc(db, 'content', 'questions', 'items', questionId);
      const snapshot = await getDoc(questionRef);
      
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
      }
      return null;
    } catch (err) {
      console.error('Error fetching question:', err);
      return null;
    }
  }, []);

  // Navigation
  const currentQuestion = questions[currentIndex] || null;
  
  const nextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return true;
    }
    return false; // No more questions
  }, [currentIndex, questions.length]);

  const previousQuestion = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return true;
    }
    return false;
  }, [currentIndex]);

  const goToQuestion = useCallback((index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  }, [questions.length]);

  return {
    questions,
    currentQuestion,
    currentIndex,
    totalQuestions: questions.length,
    loading,
    error,
    fetchQuestions,
    getQuestion,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    hasNext: currentIndex < questions.length - 1,
    hasPrevious: currentIndex > 0,
  };
};

export default useQuestions;
