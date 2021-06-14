import { render, screen } from "@testing-library/react";
import { getPrismicClient } from "../../services/prismic";
import Post, { getServerSideProps } from "../../pages/posts/[slug]";
import { mocked } from "ts-jest/utils";
import { getSession } from "next-auth/client";

jest.mock("../../services/prismic");
jest.mock("next-auth/client");

const post = {
  slug: "my-new-post",
  title: "My New Post",
  content: "<p>Post excerpt</p>",
  updatedAt: "April, 10th",
};

describe("Post page", () => {
  it("renders correctly", () => {
    render(<Post post={post} />);

    expect(screen.getByText("My New Post")).toBeInTheDocument();
    expect(screen.getByText("Post excerpt")).toBeInTheDocument();
  });

  it("redirects user if no subscripition is found", async () => {
    const getSessionMocked = mocked(getSession);
    getSessionMocked.mockResolvedValueOnce({
      activeSubscription: null,
    });

    const response = await getServerSideProps({
      params: {
        slug: "my-new-post",
      },
    } as any);

    expect(response).toEqual(
      expect.objectContaining({
        redirect: {
          destination: "/posts/preview/my-new-post",
          permanent: false,
        },
      })
    );
  });

  it("loads initial data with getServerSideProps", async () => {
    const getSessionMocked = mocked(getSession);
    getSessionMocked.mockResolvedValueOnce({
      activeSubscription: "fake-active-subscription",
    });

    const getPrismicClientMocked = mocked(getPrismicClient);
    getPrismicClientMocked.mockReturnValueOnce({
      getByUID: jest.fn().mockResolvedValueOnce({
        data: {
          title: [
            {
              type: "heading",
              text: "My new post",
            },
          ],
          content: [
            {
              type: "paragraph",
              text: "Post content",
            },
          ],
        },
        last_publication_date: "04=01=2021",
      }),
    } as any);

    const response = await getServerSideProps({
      params: {
        slug: "my-new-post",
      },
    } as any);

    expect(response).toEqual(
      expect.objectContaining({
        props: {
          post: {
            slug: "my-new-post",
            title: "My new post",
            content: "<p>Post content</p>",
            updatedAt: "April 01, 2021",
          },
        },
      })
    );
  });
});
