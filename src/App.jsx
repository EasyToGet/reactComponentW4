import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import * as bootstrap from "bootstrap";
import "./assets/style.css";
import LoginPage from "./pages/LoginPage";
import Pagination from "./component/Pagination";
import ProductModal from "./component/ProductModal";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

function App() {
  // modal 產品資料
  const [isAuth, setIsAuth] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [pageInfo, setPageInfo] = useState({});

  const productModalRef = useRef(null);
  const [modalType, setModalType] = useState("");
  const [tempProduct, setTempProduct] = useState({
    id: "",
    imageUrl: "",
    title: "",
    category: "",
    unit: "",
    origin_price: "",
    price: "",
    description: "",
    content: "",
    is_enabled: false,
    imagesUrl: [],
  });

  useEffect(() => {}, [tempProduct]);

  //  開啟 Modal 欄位
  const openModal = (product, type) => {
    setTempProduct({
      id: product.id || "",
      imageUrl: product.imageUrl || "",
      title: product.title || "",
      category: product.category || "",
      unit: product.unit || "",
      origin_price: product.origin_price || "",
      price: product.price || "",
      description: product.description || "",
      content: product.content || "",
      is_enabled: product.is_enabled || false,
      imagesUrl: product.imagesUrl || [],
    });
    productModalRef.current.show();
    setModalType(type);
  };

  //  關閉 Modal 欄位
  const closeModal = () => {
    productModalRef.current.hide();
  };

  //  讀取 modal 資料
  const handleModalInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setTempProduct((prevProduct) => ({
      ...prevProduct,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  //  讀取圖片資料
  const handleImageChange = (index, value) => {
    setTempProduct((prevProduct) => {
      const newImages = [...prevProduct.imagesUrl];
      newImages[index] = value;

      if (
        value !== "" &&
        index === newImages.length - 1 &&
        newImages.length < 5
      ) {
        newImages.push("");
      }

      if (newImages.length > 1 && newImages[newImages.length - 1] === "") {
        newImages.pop();
      }
      
      return { ...prevProduct, imagesUrl: newImages};
    });
  }

  //  新增圖片
  const handleAddImage = () => {
    setTempProduct((prevProduct) => ({
      ...prevProduct,
      imagesUrl: [...prevProduct.imagesUrl, ""],
    }));
  };

  //  移除圖片
  const handleRemoveImage = () => {
    setTempProduct((prevProduct) => {
      const newImages = [...prevProduct.imagesUrl];
      newImages.pop();
      return {...prevProduct, imagesUrl: newImages};
    });
  };
  
  //  讀取 API 資料
  const [products, setProducts] = useState([]);
  const getProducts = async (page = 1) => {
    try {
      const res = await axios.get(`${BASE_URL}/v2/api/${API_PATH}/admin/products?page=${page}`);
      setProducts(res.data.products);
      setPageInfo(res.data.pagination);
    } catch (error) {
      console.error(error);
    }
  };

  //  更改產品資料
  const updateProducts = async (id) => {
    let product;
    if (modalType === 'edit') {
      product = `product/${id}`;
    } else {
      product = `product`;
    }

    const url = `${BASE_URL}/v2/api/${API_PATH}/admin/${product}`;

    const productData = {
      data: {
        ...tempProduct,
        origin_price: Number(tempProduct.origin_price),
        price: Number(tempProduct.price),
        is_enabled: tempProduct.is_enabled ? 1 : 0,
        imagesUrl: tempProduct.imagesUrl,
      },
    };

    try {
      let res;
      if (modalType === "edit") {
        res = await axios.put(url, productData);
        console.log("更新成功:", res.data);
      } else {
        res = await axios.post(url, productData);
        console.log("新增成功:", res.data);
      }

      productModalRef.current.hide();
      getProducts();
    } catch (error) {
      if (modalType === "edit") {
        console.error("更新失敗:", error.response.data.message);
      } else {
        console.error("新增失敗:", error.response.data.message);
      }
    }
  }

  //  刪除產品資料
  const delProducts = async (id) => {
    try {
      const res =await axios.delete(
        `${BASE_URL}/v2/api/${API_PATH}/admin/product/${id}`
      );
      console.log("刪除成功:", res.data);
      productModalRef.current.hide();
      getProducts();
    } catch (error) {
      console.error("刪除失敗:", error.response.data.message);
    }
  }

  //  檢查登入
  const checkLogin = useCallback(async () => {
    try {
      await axios.post(`${BASE_URL}/v2/api/user/check`);
      getProducts();
      setIsAuth(true);
    } catch (error) {
      setIsAuth(false);
      console.error(error);
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hexToken="))
      ?.split("=")[1];

    if (token) {
      axios.defaults.headers.common.Authorization = token;
      checkLogin();
    } else {
      setIsPageLoading(false);
    }

    productModalRef.current = new bootstrap.Modal("#productModal", {
      keyboard: false,
    });
    
    document.querySelector('#productModal').addEventListener('hide.bs.modal', () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
  }, [checkLogin]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("file-to-upload", file);

    try {
      const res = await axios.post(`${BASE_URL}/v2/api/${API_PATH}/admin/upload`, formData);
      const uploadedImageUrl = res.data.imageUrl;

      setTempProduct({
        ...tempProduct,
        imageUrl: uploadedImageUrl
      })
    } catch (error) {
      console.error("上傳失敗:", error.response.data.message);
    }
  }

  return (
    <>
    {isPageLoading ? "Loading..." : (isAuth ? (
      <div className="container">
        <h2>產品列表</h2>
        <div className="text-end mt-4">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => openModal("", "new")}
          >
            建立新產品
          </button>
        </div>
        <table className="table mt-4">
          <thead>
            <tr>
              <th width="120">分類</th>
              <th>產品名稱</th>
              <th width="120">原價</th>
              <th width="120">售價</th>
              <th width="100">是否啟用</th>
              <th width="120">編輯</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.category}</td>
                <td>{product.title}</td>
                <td className="text-end">{product.origin_price}</td>
                <td className="text-end">{product.price}</td>
                <td>
                  {product.is_enabled ? (
                    <span className="text-success">啟用</span>
                  ): (
                    <span>未啟用</span>
                  )}
                </td>
                <td>
                  <div className="btn-group">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => openModal(product, "edit")}
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => openModal(product, "delete")}
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            ))}       
          </tbody>
        </table>
        <Pagination pageInfo={pageInfo} getProducts={getProducts}/>
      </div>
    ) : <LoginPage getProducts={getProducts} setIsAuth={setIsAuth} />)}
  <ProductModal
    modalType={modalType}
    tempProduct={tempProduct}
    handleFileChange={handleFileChange}
    handleModalInputChange={handleModalInputChange}
    handleImageChange={handleImageChange}
    handleAddImage={handleAddImage}
    handleRemoveImage={handleRemoveImage}
    closeModal={closeModal}
    delProducts={delProducts}
    updateProducts={updateProducts}
  />
  </>
  );
}

export default App
