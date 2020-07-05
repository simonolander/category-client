import React from 'react';
import {useCategories} from "../graphql/query/Categories";
import {is} from "remote-data-ts";
import {CategoryFragment} from "../graphql/fragment/CategoryFragment";
import {SFC32} from "shared";
import french from "../image/language-flags/french.svg"
import unknown from "../image/language-flags/borduria.png"
import english from "../image/language-flags/english.svg"
import swedish from "../image/language-flags/swedish.svg"
import {ErrorPage} from "../component/ErrorPage";

function lightColors(value: string) {
    const backgroundLuminosity = 95
    const backgroundSaturation = 70
    const foregroundLuminosity = 50
    const foregroundSaturation = 70
    const hue = new SFC32(value).nextInt(360)
    return {
        backgroundColor: `hsl(${hue}, ${backgroundSaturation}%, ${backgroundLuminosity}%)`,
        color: `hsl(${hue}, ${foregroundSaturation}%, ${foregroundLuminosity}%)`,
    }
}

function CategoryCard(props: { category: CategoryFragment }) {
    return (
        <div className="column is-6-tablet is-4-desktop is-3-widescreen is-2-fullhd">
            <div className="card" style={{
                height: "100%",
                display: "flex",
                flexDirection: "column"
            }}>
                <div className="card-image">
                    <figure className="image">
                        <img src={props.category.imageUrl} alt={`Image of ${props.category.name}`}/>
                    </figure>
                </div>
                <div className="card-content" style={{
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1
                }}>
                    <div className="media">
                        <div className="media-content">
                            <p className="title is-4">{props.category.name}</p>
                        </div>
                    </div>
                    <div className="content">{props.category.description}</div>
                    <div className="tags">
                        {props.category.tags.map(tag => (
                            <div key={tag} className="tag" style={lightColors(tag)}>{tag}</div>
                        ))}
                    </div>
                    <footer className="tags" style={{marginTop: "auto"}}>
                        {props.category.languages.map(language => {
                            let src = unknown
                            switch (language) {
                                case "french":
                                    src = french
                                    break
                                case "english":
                                    src = english
                                    break
                                case "swedish":
                                    src = swedish
                                    break
                            }
                            const style = {
                                maxWidth: "32px",
                                maxHeight: "21px",
                                margin: "5px"
                            }
                            return (
                                <img
                                    src={src}
                                    alt={language}
                                    style={style}
                                    title={`Answers available in ${language}`}
                                />
                            )
                        })}
                    </footer>
                </div>
            </div>
        </div>
    )
}

function CategoriesContent() {
    const categoriesRD = useCategories();
    if (!is.loaded(categoriesRD)) {
        return <progress className="progress is-small is-light" max="100"/>
    }
    if (is.failure(categoriesRD)) {
        return <ErrorPage error={categoriesRD.error}/>
    }
    return (
        <div className="columns is-multiline">
            {categoriesRD.data.categories.map(category => (
                <CategoryCard key={category.id} category={category}/>
            ))}
        </div>
    )
}

export default function CategoriesPage() {
    return (
        <div>
            <section className="section">
                <div className="container">
                    <h1 className="title">Categories</h1>
                    <CategoriesContent/>
                </div>
            </section>
        </div>
    );
}
