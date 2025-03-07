import { useState } from "react";
import axios from "axios";
import "../assets/style.css";

const BASE_URL = import.meta.env.VITE_BASE_URL;

function LoginPage({ getProducts, setIsAuth }) {

  const [account, setAccount] = useState({
    username: "",
    password: ""
  });

  //  帳號密碼輸入
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setAccount((prevAccount) => ({
      ...prevAccount,
      [id]: value
    }));
  };
  
  //  登入驗證
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BASE_URL}/v2/admin/signin`, account);
      const { token, expired } = res.data;
      document.cookie = `hexToken=${ token }; expires=${ new Date(expired) }`;
      axios.defaults.headers.common['Authorization'] = token;
      getProducts();
      setIsAuth(true);
    } catch (error) {
      alert('登出失敗: ' + error.response.data.message);
    }
  };

  return (
    <div className="container login">
      <div className="row justify-content-center">
        <h1 className="h3 mb-3 font-weight-normal">請先登入</h1>
        <div className="col-8">
          <form id="form" className="form-signin" onSubmit={handleSubmit}>
            <div className="form-floating mb-3">
              <input type="email" className="form-control" id="username" placeholder="name@example.com"
                value={account.username} onChange={handleInputChange} required autoFocus />
              <label htmlFor="username">Email address</label>
            </div>
            <div className="form-floating">
              <input type="password" className="form-control" id="password" placeholder="Password" value={account.password}
                onChange={handleInputChange} required />
              <label htmlFor="password">Password</label>
            </div>
            <button type="submit" className="btn btn-lg btn-primary w-100 mt-3">登入</button>
          </form>
        </div>
      </div>
      <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
    </div>
  )
}

export default LoginPage;