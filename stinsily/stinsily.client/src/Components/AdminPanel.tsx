import { useEffect, useState } from "react";

const AdminPanel = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const response = await fetch("http://localhost:5193/api/auth/is-admin", {
        method: "GET",
        credentials: "include",
      });

      const result = await response.json();
      setIsAdmin(result);
    };

    checkAdmin();
  }, []);

  return isAdmin ? <div>Welcome, Admin!</div> : <div>Access Denied</div>;
};

export default AdminPanel;
