import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log("Token from URL:", token);
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage("Passwords do not match!");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch("http://localhost:5000/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage("✅ Password successfully reset! Redirecting...");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setMessage("❌ " + (data.message || "Something went wrong"));
            }
        } catch (error) {
            setMessage("❌ Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Reset Your Password</h2>
                    <div style={styles.divider}></div>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="newPassword" style={styles.label}>
                            New Password
                        </label>
                        <input
                            id="newPassword"
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor="confirmPassword" style={styles.label}>
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </div>

                    <button 
                        type="submit" 
                        style={loading ? styles.buttonDisabled : styles.button}
                        disabled={loading}
                    >
                        {loading ? (
                            <span style={styles.buttonContent}>
                                <span style={styles.spinner}></span>
                                Processing...
                            </span>
                        ) : (
                            "Reset Password"
                        )}
                    </button>
                </form>

                {message && (
                    <div style={message.includes("✅") ? styles.successMessage : styles.errorMessage}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#F6F4E8",
        padding: "20px",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(50, 87, 71, 0.1)",
        padding: "40px",
        width: "100%",
        maxWidth: "450px",
    },
    header: {
        marginBottom: "30px",
        textAlign: "center",
    },
    title: {
        color: "#325747",
        fontSize: "24px",
        fontWeight: "600",
        marginBottom: "15px",
    },
    divider: {
        height: "3px",
        width: "60px",
        backgroundColor: "#E59560",
        margin: "0 auto",
        borderRadius: "3px",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    label: {
        color: "#325747",
        fontSize: "14px",
        fontWeight: "500",
    },
    input: {
        padding: "12px 16px",
        borderRadius: "8px",
        border: "1px solid #BACEC1",
        fontSize: "14px",
        transition: "all 0.3s ease",
        outline: "none",
        backgroundColor: "#F6F4E8",
    },
    inputFocus: {
        borderColor: "#E59560",
        boxShadow: "0 0 0 2px rgba(229, 149, 96, 0.2)",
    },
    button: {
        padding: "14px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#E59560",
        color: "#FFFFFF",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease",
        marginTop: "10px",
    },
    buttonDisabled: {
        padding: "14px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#BACEC1",
        color: "#FFFFFF",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "not-allowed",
        marginTop: "10px",
    },
    buttonContent: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
    },
    spinner: {
        width: "16px",
        height: "16px",
        border: "2px solid rgba(255, 255, 255, 0.3)",
        borderRadius: "50%",
        borderTopColor: "#FFFFFF",
        animation: "spin 1s linear infinite",
    },
    successMessage: {
        marginTop: "20px",
        padding: "12px",
        backgroundColor: "rgba(50, 87, 71, 0.1)",
        color: "#325747",
        borderRadius: "8px",
        fontSize: "14px",
        textAlign: "center",
    },
    errorMessage: {
        marginTop: "20px",
        padding: "12px",
        backgroundColor: "rgba(229, 149, 96, 0.1)",
        color: "#E59560",
        borderRadius: "8px",
        fontSize: "14px",
        textAlign: "center",
    },
    "@keyframes spin": {
        "0%": { transform: "rotate(0deg)" },
        "100%": { transform: "rotate(360deg)" },
    },
};

export default ResetPassword;