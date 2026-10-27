/**
 * Unified Quiz Access & Permission Evaluation
 * 
 * Priority Hierarchy:
 * 1. Global Deleted Check: Deleted quizzes are inaccessible.
 * 2. Individual Student Overrides:
 *    - Explicit Block (blockedStudents): Always blocked.
 *    - Explicit Allow (allowedStudents): Always allowed (bypasses class restrictions and public inactive state).
 * 3. Class Assignment:
 *    - If student belongs to a class in assignedClasses, they have access (even if quiz.isActive is false).
 * 4. Access Mode Restrictions:
 *    - 'classes': Denied if student is not in an assigned class.
 *    - 'restricted': Denied if student is not in allowedStudents.
 * 5. Public Mode ('public'):
 *    - Open if quiz.isActive is true.
 *    - Closed if quiz.isActive is false.
 */

export const evaluateStudentQuizAccess = (quiz, student) => {
  if (!quiz || quiz.isDeleted) {
    return {
      hasAccess: false,
      reason: 'deleted',
      message: 'This quiz is not available or has been deleted.',
      requiresLogin: false,
    };
  }

  const studentIdStr = student?._id?.toString() || null;
  const studentClassIdStr = student?.class?._id?.toString() || student?.class?.toString() || null;

  // Level 1: Individual Student Overrides (Explicit teacher settings for this individual)
  if (studentIdStr) {
    const isBlocked = quiz.blockedStudents?.some((id) => id.toString() === studentIdStr);
    if (isBlocked) {
      return {
        hasAccess: false,
        reason: 'studentBlocked',
        message: 'The teacher has closed access to this test for you.',
        requiresLogin: false,
      };
    }

    const isAllowedExplicitly = quiz.allowedStudents?.some((id) => id.toString() === studentIdStr);
    if (isAllowedExplicitly) {
      return {
        hasAccess: true,
        reason: 'studentAllowed',
        message: 'Access granted by teacher.',
        requiresLogin: false,
      };
    }
  }

  // Level 2: Whole Class Assignment
  const isClassAssigned = Boolean(
    studentClassIdStr && quiz.assignedClasses?.some((id) => id.toString() === studentClassIdStr)
  );

  if (isClassAssigned) {
    return {
      hasAccess: true,
      reason: 'classOpen',
      message: 'Access open for your class.',
      requiresLogin: false,
    };
  }

  // Level 3: Access Mode Restrictions
  const mode = quiz.accessMode || 'public';

  if (mode === 'classes') {
    return {
      hasAccess: false,
      reason: 'classClosed',
      message: student
        ? 'This quiz is not currently open for your class.'
        : 'This quiz is restricted to enrolled students. Please log in to take the test.',
      requiresLogin: !student,
    };
  }

  if (mode === 'restricted') {
    return {
      hasAccess: false,
      reason: 'restricted',
      message: student
        ? 'Access to this test has not been granted to your account.'
        : 'This quiz is restricted to enrolled students. Please log in to take the test.',
      requiresLogin: !student,
    };
  }

  // Level 4: Public Mode
  if (quiz.isActive) {
    return {
      hasAccess: true,
      reason: 'publicOpen',
      message: 'Quiz is currently open.',
      requiresLogin: false,
    };
  }

  return {
    hasAccess: false,
    reason: 'publicClosed',
    message: 'This quiz has been disabled by the teacher.',
    requiresLogin: false,
  };
};
