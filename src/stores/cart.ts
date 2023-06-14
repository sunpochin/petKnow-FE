import { defineStore } from "pinia";
import Auth from "@/api/auth.js";
import type { AxiosResponse } from "axios";
import { computed, ref } from "vue";
import { useRouter } from 'vue-router'
import { useNotification } from 'naive-ui'
import Cart from '@/api/cart.js'

interface cartType {
    cover: string
    discountPrice: number
    isFree: boolean
    price: number
    title: string
    instructorName: string
    _id: string
    time?:number
    level?:string
    total?:string
    couponCode?:string
    couponPrice?:Number
  }
export const useCartStore = defineStore("cart", () => {
  const accessToken = localStorage.getItem('accessToken')

  const notification = useNotification()
  const router = useRouter()
  const totalPrice = ref(0)
  const cartData = ref<cartType[]>([])
  const youMightLike = ref<cartType[]>([])
  const courseIds  =ref<string[]>([])
  const visitorCartIds  =ref<string[]>([])
  async function getCartData () {
    if(localStorage.getItem('accessToken')){
        const result = (await Cart.apiGetCartData()) as AxiosResponse
        console.log('getCartData', result)
        if (result.data.data) {
        cartData.value = result.data.data.shoppingCart
        youMightLike.value = result.data.data.youMightLike
        totalPrice.value = result.data.data.totalPrice
        courseIds.value = result.data.data.courseIds
        }
    }else{
        if(localStorage.getItem('visitorCartData') !== ''){
            visitorCartIds.value = JSON.parse((localStorage.getItem('visitorCartIds')as string))
            console.log('訪客購物車 getData',visitorCartIds.value)
        }else{
            visitorCartIds.value=[]
        }
        const result = (await Cart.apiGetVisitorCartData({
            courseIds:visitorCartIds.value,
            couponCode:''
        })) as AxiosResponse
        console.log("訪客購物車 result getData",result.data)
        if (result.data.data) {
            cartData.value = result.data.data.shoppingCart
            youMightLike.value = result.data.data.youMightLike
            totalPrice.value = result.data.data.totalPrice
            courseIds.value = result.data.data.courseIds
        }
    }
  }
  async function addCart(id:string) {
    console.log("addCart",id)
    if(localStorage.getItem('accessToken')){
        const result = (await Cart.apiPostCartData({
        courseId: id
        })) as AxiosResponse
        if(result.data.isSuccess){
            notification.success({
                content: result.data.message,
                duration: 2500,
                keepAliveOnHover: true
            })
        }else{
            notification.error({
                content: result.data.message,
                duration: 2500,
                keepAliveOnHover: true
            })
        }
        console.log('result', result.data)    
    }else{
        console.log('訪客add cart')
        if(!visitorCartIds.value.includes(id)){
            visitorCartIds.value.push(id)  
            localStorage.setItem(
                'visitorCartIds',
                JSON.stringify(visitorCartIds.value)
              )
            if(visitorCartIds.value){
                notification.success({
                    content: '成功',
                    duration: 2500,
                    keepAliveOnHover: true
                })
            }else{
                notification.error({
                    content: '新增失敗',
                    duration: 2500,
                    keepAliveOnHover: true
                })
            }
        }else{
            notification.success({
                content: '已儲存在購物車當中',
                duration: 2500,
                keepAliveOnHover: true
            })
        }

        
    }
  }
  async function deleteCart(id:string) {
    console.log("deleteCart",id)
    if(localStorage.getItem('accessToken')){
        const result = (await Cart.apiDeleteCartData({
        courseId: id
        })) as AxiosResponse
        if(result.data.isSuccess){
            notification.success({
                content: "刪除成功",
                duration: 2500,
                keepAliveOnHover: true
            })
            getCartData ()
        }else{
            notification.error({
                content: "刪除失敗",
                duration: 2500,
                keepAliveOnHover: true
            })
        }
        console.log('result', result.data)    
    }else{
        console.log('訪客 deleteCart')  
        const deleteIdx = visitorCartIds.value.findIndex((item)=>item === id)
        visitorCartIds.value.splice(deleteIdx,1)
        localStorage.setItem(
            'visitorCartIds',
            JSON.stringify(visitorCartIds.value)
          )
          if(visitorCartIds.value.length){
            notification.success({
                content: "刪除成功",
                duration: 2500,
                keepAliveOnHover: true
            })
            getCartData ()
        }else{
            notification.error({
                content: "刪除失敗",
                duration: 2500,
                keepAliveOnHover: true
            })
        }
        console.log("deleteIdx",deleteIdx,visitorCartIds.value)
    }
  }

  const orderData = ref<{
    shoppingCart:cartType[]
    totalPrice:Number
    merchantOrderNo:string
  }>({
    shoppingCart:[],
    totalPrice:0,
    merchantOrderNo:""
  })

  const couponValue = ref(null)
  const couponOptions = ref([
    {
      label: 'Drive My Car',
      value: 'song1'
    },
    {
      label: 'Norwegian Wood',
      value: 'song2'
    }
  ])
  async function createOrder(){
    if(localStorage.getItem('accessToken')){
        const result = (await Cart.apiCreateOrder({
            courseIds: courseIds.value,
            couponCode: couponValue.value || ''
        })) as AxiosResponse
        orderData.value = {
        shoppingCart:result.data.data.shoppingCart,
        totalPrice:result.data.data.totalPrice,
        merchantOrderNo:result.data.data.merchantOrderNo
        }
        console.log("createOrder",result.data.data)
        if(result.data.isSuccess){
        notification.success({
            content: result.data.message,
            duration: 2500,
            keepAliveOnHover: true
        })
        }
        router.push('/order')
    }else{
        notification.error({
            content: "結帳前請先登入",
            duration: 2500,
            keepAliveOnHover: true
        })
        router.push('/login')
        localStorage.setItem('fromVisitorCart', JSON.stringify(true))
    }
    
  }

  function addCoupon(){
    console.log('addCoupon')
  }
  function deleteCoupon(){
    console.log('deleteCoupon')
  }
  async function checkOrder(){
    console.log('checkOrder')
    // const result = (await Cart.apiPostOrderCheck()) as AxiosResponse
  }
  return {  
    cartData,
    youMightLike,
    totalPrice,
    orderData,visitorCartIds,
    couponValue,
    couponOptions,
    addCart,
    deleteCart,
    createOrder,
    checkOrder,
    getCartData,
    addCoupon,
    deleteCoupon };
});