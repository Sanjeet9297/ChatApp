export const logoutUser = (dispatch: any) => {
    dispatch({ type: 'LOGOUT_USER' });
    // Any other global cleanup (like navigation to Login)
};
