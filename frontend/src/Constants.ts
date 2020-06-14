export const AppName = "Category Theory"
const devGraphqlHost = "http://localhost:5001/category-131ad/us-central1/graphql"
const prodGraphqlHost = "https://us-central1-category-131ad.cloudfunctions.net/graphql"
const prod = false
export const graphqlHost = prod ? prodGraphqlHost : devGraphqlHost
