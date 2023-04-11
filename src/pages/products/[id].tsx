import { ImageContainer, ProductContainer, ProductsDetails } from "../../styles/pages/products"
import { GetStaticPaths, GetStaticProps } from "next"
import { stripe } from "../../lib/stripe"
import Stripe from "stripe"
import Image from "next/image"
import { useRouter } from "next/router"
import axios from "axios"
import { useState } from "react"
import Head from "next/head"

interface ProductProps {
    product: {
        id: string
        name: string
        imageURL: string
        price: string
        description: string
        defaultPriceId: string
    }
}

export default function Product({ product }: ProductProps) {
    const [isCreatingCheckoutSession, setIsCreatingCheckoutSession] = useState(false)
    
    // 1- Caso a rota fosse interna da aplicação
    // const router = useRouter()

    // Caso a fallback fosse true, para criar uma pagina de loading
    // const { isFallback } = useRouter()
    // if(isFallback) {
    //     <p>Loading...</p>
    // }

    async function handleBuyProduct() {

        try {
            setIsCreatingCheckoutSession(true)

            const response = await axios.post('/api/checkout', {
                priceId: product.defaultPriceId,
            })

            const { checkoutUrl } = response.data

            // 1- Caso a rota fosse interna da aplicação
            // router.push('/checkout')

            window.location.href = checkoutUrl

        } catch(err) {
            // Conectar com uma ferramenta de observabilidade (Datalog / Sentry)

            setIsCreatingCheckoutSession(false)
            alert("Houve um erro no redirecionamento")
        }
    }

    return (
        <>
            <Head>
                <title>{product.name} | Ignite Shop</title>
            </Head>
            <ProductContainer>
                <ImageContainer>
                    <Image src={product.imageURL} width={520} height={480} alt={product.name}/>
                </ImageContainer>
                <ProductsDetails>
                    <h1>{product.name}</h1>
                    <span>{product.price}</span>

                    <p>{product.description}</p>

                    <button disabled={isCreatingCheckoutSession} onClick={handleBuyProduct}>Comprar agora</button>
                </ProductsDetails>
            </ProductContainer>
        </>
    )
}

export const getStaticPaths: GetStaticPaths = async () => {
    return {
        paths: [
            {
                params: {
                    id: "prod_Nd2Q5sbZwyT7u9"
                },
            },
        ],
        fallback: 'blocking',
    }
}

export const getStaticProps: GetStaticProps<any, { id: string }> = async ({ params }) => {
    const productId = params.id;

    const product = await stripe.products.retrieve(productId, {
        expand: ['default_price']
    })

    const price = product.default_price as Stripe.Price;
    
    return {
        props: {
            product: {
                id: product.id,
                name: product.name,
                imageURL: product.images[0],
                price: new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                }).format(price.unit_amount / 100),
                description: product.description,
                defaultPriceId: price.id,
            }
        },
        revalidate: 60 * 60 *1, // 1 hour 
    }
}